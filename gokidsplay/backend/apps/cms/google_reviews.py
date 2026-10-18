"""
Google reviews for the Testimonies page, from the official Google Places API (New).

Set GOOGLE_PLACES_API_KEY in backend/.env (a Google Cloud key with the
"Places API (New)" enabled). Then:
  - the first sync finds the Go Kids Play Place ID from GoogleReviewsProfile.search_query
  - every sync stores the overall rating + number of reviews and imports the
    reviews Google returns (up to 5, its "most relevant") as Customer Reviews
    (platform "Google"), keeping the reviewer's name, photo and a link back to Google.
  - staff can hide any review in Website Content → Customer Reviews; a re-sync
    never switches a hidden review back on.

Runs: Admin "Sync now" button, `python manage.py sync_google_reviews`, and
automatically when the page is viewed and the data is over SYNC_EVERY old.
"""
import logging
from datetime import datetime, timedelta

import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

PLACES_URL = 'https://places.googleapis.com/v1'
SYNC_EVERY = timedelta(hours=12)
TIMEOUT = 8


class GoogleReviewsError(Exception):
    pass


def api_key() -> str:
    return getattr(settings, 'GOOGLE_PLACES_API_KEY', '') or ''


def _get(url, field_mask, **kwargs):
    response = requests.get(url, headers={'X-Goog-Api-Key': api_key(), 'X-Goog-FieldMask': field_mask},
                            timeout=TIMEOUT, **kwargs)
    return _json(response)


def _json(response):
    try:
        data = response.json()
    except ValueError:
        data = {}
    if response.status_code != 200:
        message = (data.get('error') or {}).get('message') or f'HTTP {response.status_code}'
        raise GoogleReviewsError(f'Google Places API: {message}')
    return data


def find_place_id(query: str) -> tuple:
    """(place_id, maps_url) for the business, from a text search."""
    response = requests.post(f'{PLACES_URL}/places:searchText', json={'textQuery': query, 'regionCode': 'GB'},
                             headers={'X-Goog-Api-Key': api_key(),
                                      'X-Goog-FieldMask': 'places.id,places.displayName,places.googleMapsUri'},
                             timeout=TIMEOUT)
    places = _json(response).get('places') or []
    if not places:
        raise GoogleReviewsError(f'No Google listing found for "{query}"')
    return places[0]['id'], places[0].get('googleMapsUri', '')


def _review_date(iso: str):
    try:
        return datetime.fromisoformat(iso.replace('Z', '+00:00'))
    except (AttributeError, ValueError):
        return None


def sync_google_reviews() -> dict:
    """Fetch the rating and reviews from Google. Raises GoogleReviewsError on failure."""
    from .models import GoogleReviewsProfile, Testimonial

    profile = GoogleReviewsProfile.get()
    if not api_key():
        raise GoogleReviewsError('GOOGLE_PLACES_API_KEY is not set in backend/.env')
    try:
        if not profile.place_id:
            profile.place_id, maps_url = find_place_id(profile.search_query)
            profile.maps_url = profile.maps_url or maps_url
        place = _get(f'{PLACES_URL}/places/{profile.place_id}',
                     'id,displayName,rating,userRatingCount,googleMapsUri,reviews',
                     params={'languageCode': 'en-GB'})
    except requests.RequestException as exc:
        profile.last_error = f'Could not reach Google: {exc}'
        profile.save(update_fields=['last_error', 'place_id', 'maps_url', 'updated_at'])
        raise GoogleReviewsError(profile.last_error) from exc
    except GoogleReviewsError as exc:
        profile.last_error = str(exc)
        profile.save(update_fields=['last_error', 'place_id', 'maps_url', 'updated_at'])
        raise

    created = updated = 0
    for review in place.get('reviews') or []:
        review_id = review.get('name')
        text = (review.get('text') or review.get('originalText') or {}).get('text', '').strip()
        if not review_id or not text:
            continue  # star-only reviews have nothing to show
        author = review.get('authorAttribution') or {}
        published = _review_date(review.get('publishTime'))
        rating = int(review.get('rating') or 5)
        values = {
            'name': author.get('displayName') or 'Google user',
            'content': text,
            'rating': rating,
            'image_url': author.get('photoUri') or None,
            'platform': 'Google',
            'review_date': published.strftime('%B %Y') if published else review.get('relativePublishTimeDescription', ''),
            'review_url': review.get('googleMapsUri') or author.get('uri') or place.get('googleMapsUri', ''),
            'published_at': published,
        }
        existing = Testimonial.objects.filter(external_id=review_id).first()
        if existing:
            for field, value in values.items():
                setattr(existing, field, value)
            existing.save()  # keeps the admin's Show-on-website choice
            updated += 1
        else:
            Testimonial.objects.create(external_id=review_id, active=rating >= profile.min_rating_to_show, **values)
            created += 1

    profile.rating = place.get('rating')
    profile.review_count = place.get('userRatingCount')
    profile.maps_url = place.get('googleMapsUri') or profile.maps_url
    profile.last_synced = timezone.now()
    profile.last_error = ''
    profile.save()
    logger.info('Google reviews synced: %s new, %s updated, rating %s (%s)', created, updated, profile.rating, profile.review_count)
    return {'created': created, 'updated': updated, 'rating': profile.rating, 'review_count': profile.review_count}


def sync_if_stale():
    """Refresh in the background of a page view when the data is old (never raises)."""
    from .models import GoogleReviewsProfile
    profile = GoogleReviewsProfile.get()
    if not api_key() or not profile.auto_sync:
        return
    if profile.last_synced and timezone.now() - profile.last_synced < SYNC_EVERY:
        return
    if profile.last_error and profile.updated_at and timezone.now() - profile.updated_at < timedelta(minutes=30):
        return  # don't hammer Google after a failure
    try:
        sync_google_reviews()
    except GoogleReviewsError as exc:
        logger.warning('Google reviews sync failed: %s', exc)
