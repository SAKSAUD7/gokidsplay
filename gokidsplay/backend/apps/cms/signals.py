"""
Signals for CMS app
Auto-fetch and save Instagram reel thumbnails locally when saving
"""
import requests
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import InstagramReel
import logging
import os

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=InstagramReel)
def fetch_instagram_thumbnail(sender, instance, **kwargs):
    """
    Automatically fetch thumbnail from Instagram oEmbed API and save it locally.
    This ensures thumbnails work reliably without Instagram's hotlinking restrictions.
    """
    # Only fetch if reel_url is provided and thumbnail_url is empty or looks like an Instagram URL
    if not instance.reel_url:
        return
    
    # Check if we need to fetch (empty thumbnail or Instagram URL that won't work)
    needs_fetch = (
        not instance.thumbnail_url or 
        '/media/?size=' in instance.thumbnail_url or
        instance.thumbnail_url.startswith('https://www.instagram.com/reel/') or
        instance.thumbnail_url.startswith('https://instagram.fb') or
        instance.thumbnail_url.startswith('https://scontent')
    )
    
    if not needs_fetch:
        return
    
    try:
        # Use Instagram's oEmbed API to get reel metadata
        oembed_url = f"https://www.instagram.com/api/v1/oembed/?url={instance.reel_url}"
        
        logger.info(f"Fetching Instagram thumbnail for: {instance.reel_url}")
        
        # Add headers to mimic a browser to avoid some basic bot detection
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(oembed_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Extract thumbnail URL from oEmbed response
            if 'thumbnail_url' in data:
                thumbnail_url = data['thumbnail_url']
                logger.info(f"Found thumbnail URL: {thumbnail_url}")
                
                # Download the thumbnail image
                img_response = requests.get(thumbnail_url, timeout=10)
                
                if img_response.status_code == 200:
                    # Generate filename from reel URL - sanitize for filesystem
                    reel_id = instance.reel_url.rstrip('/').split('/')[-1]
                    # Remove any characters that might be invalid for filenames
                    safe_reel_id = "".join(c for c in reel_id if c.isalnum() or c in ('-', '_'))
                    filename = f"{safe_reel_id}_thumbnail.jpg"
                    
                    # Ensure the uploads/reels directory exists
                    from django.conf import settings
                    reels_dir = os.path.join(settings.MEDIA_ROOT, 'uploads', 'reels')
                    os.makedirs(reels_dir, exist_ok=True)
                    
                    # Save the file
                    file_path = os.path.join(reels_dir, filename)
                    with open(file_path, 'wb') as f:
                        f.write(img_response.content)
                    
                    # Update thumbnail_url to point to local file
                    instance.thumbnail_url = f"/media/uploads/reels/{filename}"
                    logger.info(f"Successfully saved thumbnail locally: {instance.thumbnail_url}")
                else:
                    logger.error(f"Failed to download thumbnail image. Status: {img_response.status_code}")
            else:
                logger.warning(f"No thumbnail_url in oEmbed response for {instance.reel_url}")
        else:
            logger.error(f"Failed to fetch Instagram oEmbed data. Status: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching Instagram thumbnail: {str(e)}")
        # Don't raise exception - allow save to continue even if fetch fails
    except Exception as e:
        logger.error(f"Unexpected error fetching Instagram thumbnail: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
