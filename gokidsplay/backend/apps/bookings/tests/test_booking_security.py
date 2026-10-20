"""
Security and pricing tests for the public booking endpoints.

The booking wizard creates bookings anonymously, so these endpoints are public.
They must never trust money or payment fields sent by the client.
"""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.bookings.models import Booking, PartyBooking
from apps.bookings.pricing import price_party_booking
from apps.cms.models import ContactMessage, PricingPlan, SessionBookingConfig
from apps.shop.models import Voucher

SESSIONS_URL = '/api/v1/bookings/bookings/'
PARTIES_URL = '/api/v1/bookings/party-bookings/'


def next_saturday():
    today = date.today()
    return today + timedelta(days=(5 - today.weekday()) % 7 + 7)


@pytest.fixture
def config(db):
    cfg = SessionBookingConfig.get_config()
    cfg.adult_price = Decimal('9.95')
    cfg.kid_price = Decimal('9.95')
    cfg.spectator_price = Decimal('2.95')
    cfg.parking_price = Decimal('3.00')
    cfg.gst_rate = Decimal('0')
    cfg.save()
    return cfg


@pytest.fixture
def plans(db):
    """The four Go Kids Play admission tickets (same as the live site)."""
    def make(name, price, order, spectator=False):
        return PricingPlan.objects.create(
            name=name, type='SESSION', price=Decimal(price), duration=120, order=order, active=True,
            is_spectator=spectator, features=[])
    return {
        'infant': make('Under 12 months', '1.95', 1),
        'toddler': make('Under 24 months', '7.95', 2),
        'child': make('24 months and above', '12.95', 3),
        'adult': make('Non-playing Adult', '4.95', 4, spectator=True),
    }


@pytest.fixture
def staff_client(db):
    user = get_user_model().objects.create_user(
        username='staff-test', email='staff-test@example.com', password='x-Test-12345', is_staff=True
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def session_payload(plans, **overrides):
    payload = {
        'name': 'Test Parent', 'email': 'parent@example.com', 'phone': '07700900123',
        'date': next_saturday().isoformat(), 'time': '10:30', 'duration': 120, 'type': 'SESSION',
        # 3 children + 1 toddler + 2 non-playing adults
        'tickets': {plans['child'].id: 3, plans['toddler'].id: 1, plans['adult'].id: 2},
    }
    payload.update(overrides)
    return payload


# ── Pricing ──────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAdmissionPricing:
    def test_price_uses_pricing_plans(self, config, plans):
        from apps.bookings.pricing import price_admission
        price = price_admission(tickets={plans['child'].id: 3, plans['toddler'].id: 1, plans['adult'].id: 2},
                                add_ons=[{'id': 'parking', 'qty': 1}])
        # 3 x 12.95 + 7.95 + 2 x 4.95 + parking 3.00 = 59.70, + 2.00 online fee
        assert price.subtotal == Decimal('59.70')
        assert price.amount == Decimal('61.70')
        assert (price.players, price.spectators) == (4, 2)

    def test_client_prices_and_unknown_tickets_are_ignored(self, config, plans):
        from apps.bookings.pricing import price_admission
        price = price_admission(tickets=[{'plan_id': plans['child'].id, 'qty': 1, 'price_each': 0},
                                         {'plan_id': 99999, 'qty': 5}])
        assert price.subtotal == Decimal('12.95')

    def test_at_least_one_playing_ticket_required(self, config, plans):
        from apps.bookings.pricing import price_admission
        assert price_admission(tickets={plans['adult'].id: 2}).error


@pytest.mark.django_db
class TestPartyPricing:
    def test_base_package_covers_ten_kids_and_ten_adults(self):
        assert price_party_booking(kids=10, adults=10).amount == Decimal('250.00')

    def test_extra_guests_and_deposit(self):
        price = price_party_booking(kids=12, adults=12)
        assert price.amount == Decimal('299.90')  # 250 + 2 x 20.00 + 2 x 4.95
        assert price.deposit == Decimal('149.95')


# ── Public session bookings ──────────────────────────────────────────────────

@pytest.mark.django_db
class TestPublicSessionBooking:
    def test_forged_amount_and_payment_status_are_ignored(self, config, plans):
        response = APIClient().post(SESSIONS_URL, session_payload(
            plans, amount='0.01', subtotal='0.01', paid_amount='999', payment_status='PAID', kids=0
        ), format='json')
        assert response.status_code == 201, response.data
        booking = Booking.objects.get(id=response.data['id'])
        assert booking.amount == Decimal('58.70')  # 3 x 12.95 + 7.95 + 2 x 4.95 + 2.00 fee
        assert (booking.kids, booking.spectators) == (4, 2)
        assert len(booking.tickets) == 3
        assert booking.paid_amount == Decimal('0')
        assert booking.payment_status == 'PENDING'

    def test_tickets_are_required(self, config, plans):
        payload = session_payload(plans)
        payload.pop('tickets')
        response = APIClient().post(SESSIONS_URL, {**payload, 'adults': 2, 'kids': 5}, format='json')
        assert response.status_code == 400
        assert Booking.objects.count() == 0

    def test_invalid_voucher_is_rejected(self, config, plans):
        response = APIClient().post(SESSIONS_URL, session_payload(plans, voucher_code='NOT-REAL'), format='json')
        assert response.status_code == 400
        assert Booking.objects.count() == 0

    def test_valid_voucher_discounts_and_counts_usage(self, config, plans):
        voucher = Voucher.objects.create(code='SAVE10', discount_type='PERCENTAGE', discount_value=Decimal('10'),
                                         is_active=True, usage_limit=5, used_count=0)
        response = APIClient().post(SESSIONS_URL, session_payload(plans, voucher_code='save10'), format='json')
        assert response.status_code == 201, response.data
        booking = Booking.objects.get(id=response.data['id'])
        assert booking.discount_amount == Decimal('5.67')  # 10% of 56.70 subtotal, rounded half-up
        assert booking.amount == Decimal('53.03')
        voucher.refresh_from_db()
        assert voucher.used_count == 1

    def test_staff_can_set_custom_amount(self, config, plans, staff_client):
        response = staff_client.post(SESSIONS_URL, session_payload(plans, amount='5.00', adults=1, kids=1), format='json')
        assert response.status_code == 201, response.data
        assert Booking.objects.get(id=response.data['id']).amount == Decimal('5.00')

    def test_booking_list_is_a_plain_list_unless_a_page_is_asked_for(self, config, plans, staff_client):
        APIClient().post(SESSIONS_URL, session_payload(plans), format='json')
        assert isinstance(staff_client.get(SESSIONS_URL).data, list)
        paged = staff_client.get(SESSIONS_URL, {'page': 1, 'page_size': 10}).data
        assert paged['count'] == 1 and len(paged['results']) == 1

    def test_admin_booking_list_works_with_bookings(self, config, plans, staff_client):
        APIClient().post(SESSIONS_URL, session_payload(plans), format='json')
        assert staff_client.get(SESSIONS_URL).status_code == 200


# ── Opening hours & session rules (CMS Session Booking Configuration) ────────

@pytest.mark.django_db
class TestSessionRules:
    def test_live_site_defaults(self, config):
        from apps.bookings.opening_hours import session_start_times, weekly_hours
        saturday = next_saturday()
        sunday = saturday + timedelta(days=1)
        assert weekly_hours(saturday) == weekly_hours(sunday) == ('10:30', '18:00')
        for weekday in range(2, 7):                     # Monday–Friday: closed except school / bank holidays
            assert weekly_hours(saturday + timedelta(days=weekday)) is None
        assert session_start_times(saturday) == ['10:30']  # "2 Hours Anytime"

    def test_arrival_mode_lists_times_that_fit_before_closing(self, config):
        from apps.bookings.opening_hours import session_start_times
        config.session_mode = 'ARRIVAL'
        config.arrival_interval_minutes = 30
        config.save()
        times = session_start_times(next_saturday())
        assert times[0] == '10:30' and times[-1] == '16:00'  # 16:00 + 2h = 18:00 closing

    def test_booking_fee_comes_from_cms(self, config, plans):
        from apps.bookings.pricing import price_admission
        config.online_booking_fee = Decimal('1.50')
        config.save()
        assert price_admission(tickets={plans['child'].id: 1}).amount == Decimal('14.45')

    def test_public_booking_needs_a_real_session_time(self, config, plans):
        response = APIClient().post(SESSIONS_URL, session_payload(plans, time='19:00'), format='json')
        assert response.status_code == 400
        assert response.data['code'] == 'INVALID_TIME'

    def test_past_dates_are_rejected(self, config, plans):
        past = (date.today() - timedelta(days=7)).isoformat()
        response = APIClient().post(SESSIONS_URL, session_payload(plans, date=past), format='json')
        assert response.status_code == 400

    def test_same_day_anytime_booking_until_an_hour_before_closing(self, config):
        from datetime import datetime
        from django.utils import timezone
        from apps.bookings.opening_hours import is_session_still_bookable
        saturday = next_saturday()
        tz = timezone.get_current_timezone()
        at = lambda hhmm: timezone.make_aware(datetime.combine(saturday, datetime.strptime(hhmm, '%H:%M').time()), tz)
        assert is_session_still_bookable(saturday, '10:30', now=at('14:00'))      # booked at 2pm
        assert is_session_still_bookable(saturday, '10:30', now=at('16:55'))
        assert not is_session_still_bookable(saturday, '10:30', now=at('17:15'))  # within the last hour

    def test_anytime_capacity_counts_the_whole_day(self, config, plans):
        config.session_capacity = 5
        config.save()
        assert APIClient().post(SESSIONS_URL, session_payload(plans), format='json').status_code == 201  # 4 players
        response = APIClient().post(SESSIONS_URL, session_payload(plans), format='json')                # 4 more
        assert response.status_code == 409

    def test_slot_availability_uses_cms_hours(self, config):
        response = APIClient().get(SESSIONS_URL + 'slot_availability/', {'date': next_saturday().isoformat()})
        assert response.status_code == 200
        assert list(response.data['slots']) == ['10:30']
        assert response.data['slots']['10:30']['slot_end'] == '18:00'

    def test_party_slots_follow_party_config(self):
        from apps.bookings.availability_service import GKPAvailabilityService
        from apps.cms.models import PartyBookingConfig
        PartyBookingConfig.objects.create(available_time_slots=['12:00 PM', '2:30 PM'])
        slots = GKPAvailabilityService().get_party_slots(next_saturday())
        assert list(slots) == ['12:00', '14:30']


# ── Party bookings ───────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPartyBookingEndpoint:
    def party_payload(self, **overrides):
        payload = {
            'name': 'Party Parent', 'email': 'party@example.com', 'phone': '07700900123',
            'date': next_saturday().isoformat(), 'time': '14:00:00', 'kids': 12, 'adults': 2,
            'payment_type': 'DEPOSIT',
        }
        payload.update(overrides)
        return payload

    def test_public_cannot_list_party_bookings(self):
        assert APIClient().get(PARTIES_URL).status_code == 401

    def test_forged_party_amount_and_status_are_ignored(self):
        response = APIClient().post(PARTIES_URL, self.party_payload(amount=1, deposit_amount=0.5, status='CONFIRMED'),
                                    format='json')
        assert response.status_code == 201, response.data
        party = PartyBooking.objects.get(id=response.data['id'])
        assert party.amount == Decimal('290.00')  # 250 + 2 x 20.00
        assert party.deposit_amount == Decimal('145.00')
        assert party.status == 'PENDING'

    def test_staff_can_list_party_bookings(self, staff_client):
        APIClient().post(PARTIES_URL, self.party_payload(), format='json')
        response = staff_client.get(PARTIES_URL)
        assert response.status_code == 200
        assert len(response.data) == 1


# ── Data that must not be public ─────────────────────────────────────────────

@pytest.mark.django_db
class TestPrivateData:
    def test_contact_messages_are_not_public(self):
        ContactMessage.objects.create(name='A', email='a@example.com', message='Hello')
        assert APIClient().get('/api/v1/cms/contact-messages/').status_code == 401

    def test_contact_form_still_accepts_messages(self):
        response = APIClient().post('/api/v1/cms/contact-messages/', {
            'name': 'Visitor', 'email': 'visitor@example.com', 'message': 'Do you open on Monday?',
        }, format='json')
        assert response.status_code == 201, response.data

    def test_voucher_codes_are_not_listed_publicly(self):
        Voucher.objects.create(code='SECRET', discount_type='FLAT', discount_value=Decimal('5'), is_active=True)
        assert APIClient().get('/api/v1/shop/vouchers/').status_code == 401


# ── Special events ───────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestEventBooking:
    def make_event(self):
        from datetime import time
        from apps.bookings.models import SpecialEvent
        return SpecialEvent.objects.create(
            title='Halloween Party', slug='halloween-party', date=next_saturday(),
            start_time=time(14, 0), end_time=time(16, 0), status='PUBLISHED',
            total_capacity=20, price_per_child=Decimal('10.00'), price_per_adult=Decimal('5.00'))

    def test_negative_attendees_are_rejected(self):
        event = self.make_event()
        response = APIClient().post('/api/v1/bookings/public/events/book/', {
            'event_id': event.id, 'num_children': -5, 'num_adults': 6,
            'name': 'Alex Parent', 'email': 'a@example.com', 'phone': '07700900123'}, format='json')
        assert response.status_code == 400

    def book(self, event, **overrides):
        payload = {'event_id': event.id, 'num_children': 2, 'num_adults': 1,
                   'name': 'Event Parent', 'email': 'event@example.com', 'phone': '07700900123'}
        payload.update(overrides)
        return APIClient().post('/api/v1/bookings/public/events/book/', payload, format='json')

    def test_cancelling_an_event_cancels_reservations_and_emails_customers(self, staff_client):
        from apps.bookings.models import EventBooking
        event = self.make_event()
        assert self.book(event).status_code == 201
        assert self.book(event, email='second@example.com').status_code == 201
        EventBooking.objects.filter(email='second@example.com').update(amount_paid=Decimal('10.00'))
        response = staff_client.post(f'/api/v1/bookings/events/{event.id}/cancel/', {'reason': 'Heating failure'},
                                     format='json')
        assert response.status_code == 200, response.data
        assert response.data['bookings_cancelled'] == 2 and response.data['bookings_to_refund'] == 1
        assert set(EventBooking.objects.values_list('status', flat=True)) == {'CANCELLED'}
        event.refresh_from_db()
        assert event.status == 'CANCELLED'

    def test_reservations_take_places_and_cancelling_frees_them(self, staff_client):
        from apps.bookings.models import EventBooking
        event = self.make_event()  # capacity 20
        assert self.book(event, num_children=15, num_adults=0).status_code == 201
        booking = EventBooking.objects.get()
        assert (booking.status, booking.payment_status) == ('CONFIRMED', 'PENDING')  # pay at the venue
        event.refresh_from_db()
        assert event.available_spots == 5
        assert self.book(event, num_children=6, num_adults=0).status_code == 400  # would overbook
        assert staff_client.post(f'/api/v1/bookings/event-bookings/{booking.id}/cancel/').status_code == 200
        assert event.available_spots == 20

    def test_admin_marks_payment_taken_at_venue(self, staff_client):
        from apps.bookings.models import EventBooking
        event = self.make_event()
        self.book(event)
        booking = EventBooking.objects.get()
        response = staff_client.post(f'/api/v1/bookings/event-bookings/{booking.id}/mark-paid/')
        assert response.status_code == 200
        booking.refresh_from_db()
        assert (booking.payment_status, booking.amount_paid, booking.balance_due) == ('FULLY_PAID', Decimal('25.00'), Decimal('0'))

    def test_past_events_cannot_be_booked(self):
        event = self.make_event()
        from django.utils import timezone
        event.date = timezone.localdate() - timedelta(days=1)   # UK date, like the server
        event.save()
        assert self.book(event).status_code == 400

    def test_contact_details_are_required(self):
        assert self.book(self.make_event(), email='not-an-email').status_code == 400

    def test_reservations_are_not_public(self):
        assert APIClient().get('/api/v1/bookings/event-bookings/').status_code == 401

    def test_event_request_is_saved_for_admins(self, staff_client):
        from apps.bookings.models import EventRequest
        response = APIClient().post('/api/v1/bookings/public/events/request/', {
            'name': 'Request Parent', 'email': 'request@example.com', 'phone': '07700900123',
            'event_type': 'BIRTHDAY', 'preferred_date': next_saturday().isoformat(),
            'num_children': 12, 'num_adults': 6, 'details': 'Superhero themed party for my son',
        }, format='json')
        assert response.status_code == 201, response.data
        req = EventRequest.objects.get()
        assert req.status == 'NEW' and req.reference.startswith('ER')
        assert APIClient().get('/api/v1/bookings/event-requests/').status_code == 401
        listing = staff_client.get('/api/v1/bookings/event-requests/')
        assert listing.status_code == 200 and listing.data[0]['reference'] == req.reference
        update = staff_client.patch(f'/api/v1/bookings/event-requests/{req.id}/',
                                    {'status': 'CONTACTED', 'admin_notes': 'Called, sending a quote'}, format='json')
        assert update.status_code == 200 and update.data['status'] == 'CONTACTED'

    def test_event_request_validation(self):
        response = APIClient().post('/api/v1/bookings/public/events/request/', {
            'name': 'A Parent', 'email': 'a@example.com', 'phone': '07700900123',
            'preferred_date': (date.today() - timedelta(days=3)).isoformat(),
            'num_children': 5, 'details': 'A party please',
        }, format='json')
        assert response.status_code == 400

    def test_event_price_is_calculated_on_server(self):
        from apps.bookings.models import EventBooking
        event = self.make_event()
        response = APIClient().post('/api/v1/bookings/public/events/book/', {
            'event_id': event.id, 'num_children': 2, 'num_adults': 1, 'subtotal': '0.01',
            'name': 'Alex Parent', 'email': 'a@example.com', 'phone': '07700900123'}, format='json')
        assert response.status_code in (200, 201), response.data
        assert EventBooking.objects.get().subtotal == Decimal('25.00')


# ── Customer password reset ──────────────────────────────────────────────────

@pytest.mark.django_db
class TestPasswordReset:
    AUTH = '/api/v1/bookings/customer-auth/'

    def register(self, email):
        response = APIClient().post(self.AUTH + 'register/', {
            'name': 'Reset Parent', 'email': email, 'password': 'old-password'}, format='json')
        assert response.status_code == 201, response.data

    def test_reset_link_changes_password_once(self):
        from apps.bookings.customer_auth import make_password_reset_token
        from apps.bookings.models import CustomerToken
        from apps.emails.models import EmailLog
        self.register('reset-ok@example.com')
        client = APIClient()
        assert client.post(self.AUTH + 'forgot-password/', {'email': 'reset-ok@example.com'}, format='json').status_code == 200
        assert EmailLog.objects.filter(email_type='ACCOUNT_PASSWORD_RESET', recipient_email='reset-ok@example.com').exists()

        token = make_password_reset_token(CustomerToken.objects.get(customer__email='reset-ok@example.com'))
        response = client.post(self.AUTH + 'reset-password/', {'token': token, 'password': 'new-password'}, format='json')
        assert response.status_code == 200, response.data
        assert response.data['token']
        login = client.post(self.AUTH + 'login/', {'email': 'reset-ok@example.com', 'password': 'new-password'}, format='json')
        assert login.status_code == 200
        # The same link cannot be used again
        again = client.post(self.AUTH + 'reset-password/', {'token': token, 'password': 'other-password'}, format='json')
        assert again.status_code == 400

    def test_signing_out_keeps_the_account(self):
        self.register('logout-ok@example.com')
        client = APIClient()
        token = client.post(self.AUTH + 'login/', {'email': 'logout-ok@example.com', 'password': 'old-password'}, format='json').data['token']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        assert client.post(self.AUTH + 'logout/').status_code == 200
        assert client.get(self.AUTH + 'me/').status_code == 401               # old session ended
        again = APIClient().post(self.AUTH + 'login/', {'email': 'logout-ok@example.com', 'password': 'old-password'}, format='json')
        assert again.status_code == 200                                         # can still sign in

    def test_signing_in_on_another_device_keeps_the_first_session(self):
        self.register('two-devices@example.com')
        creds = {'email': 'two-devices@example.com', 'password': 'old-password'}
        first = APIClient().post(self.AUTH + 'login/', creds, format='json').data['token']
        APIClient().post(self.AUTH + 'login/', creds, format='json')
        laptop = APIClient()
        laptop.credentials(HTTP_AUTHORIZATION=f'Bearer {first}')
        assert laptop.get(self.AUTH + 'me/').status_code == 200

    def test_unknown_email_gets_the_same_reply(self):
        from apps.emails.models import EmailLog
        response = APIClient().post(self.AUTH + 'forgot-password/', {'email': 'nobody-here@example.com'}, format='json')
        assert response.status_code == 200
        assert not EmailLog.objects.filter(recipient_email='nobody-here@example.com').exists()

    def test_tampered_token_is_rejected(self):
        response = APIClient().post(self.AUTH + 'reset-password/', {'token': 'abc:def', 'password': 'new-password'},
                                    format='json')
        assert response.status_code == 400


# ── Customer emails ──────────────────────────────────────────────────────────

@pytest.mark.parametrize('template', [
    'emails/booking/session_confirmation.html',
    'emails/booking/party_confirmation.html',
    'emails/booking/post_visit_thank_you.html',
    'emails/booking/event_confirmation.html',
    'emails/birthday_reminder.html',
    'emails/admin/contact_message.html',
    'emails/account/password_reset.html',
])
def test_emails_are_go_kids_play_branded(template):
    from django.template.loader import render_to_string
    html = render_to_string(template, {
        'site_url': 'https://www.gokidsplay.co.uk', 'customer_name': 'Sam', 'booking_uuid': 'abc',
        'activity_name': 'All-Access Play Session', 'booking_date': '2026-10-24', 'booking_time': '14:00',
        'event_title': 'Halloween Party', 'current_year': 2026,
    })
    assert 'Go Kids Play' in html
    for old_brand in ('Spin Pin', 'spinpin', 'Ninja Inflatable Park', '+91'):
        assert old_brand not in html, f'{template} still mentions {old_brand}'


# ── Site-wide hardening ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestHardening:
    def test_maintenance_endpoints_are_gone(self):
        # These used to reset the admin password / run seed scripts for anyone
        for url in ('/api/v1/reset-admin/', '/api/v1/seed-db/', '/api/v1/fix-logo/'):
            assert APIClient().get(url).status_code == 404, url

    def test_cors_only_for_allowed_origins(self):
        client = APIClient()
        evil = client.get('/api/v1/cms/pricing-plans/', HTTP_ORIGIN='https://evil.example.com')
        assert 'Access-Control-Allow-Origin' not in evil
        ours = client.get('/api/v1/cms/pricing-plans/', HTTP_ORIGIN='https://www.gokidsplay.co.uk')
        assert ours['Access-Control-Allow-Origin'] == 'https://www.gokidsplay.co.uk'

    def test_health_check_reports_database(self):
        response = APIClient().get('/api/health/')
        assert response.status_code == 200
        assert response.json()['database'] == 'ok'


def test_rate_limit_ip_cannot_be_spoofed(settings):
    from django.test import RequestFactory
    from apps.core.throttling import client_ip
    factory = RequestFactory()
    spoofed = factory.get('/', HTTP_X_FORWARDED_FOR='1.2.3.4', REMOTE_ADDR='10.0.0.5')
    settings.TRUSTED_PROXY_COUNT = 0
    assert client_ip(spoofed) == '10.0.0.5'          # no proxy: header ignored
    settings.TRUSTED_PROXY_COUNT = 1
    behind_azure = factory.get('/', HTTP_X_FORWARDED_FOR='1.2.3.4, 81.2.69.160:53122', REMOTE_ADDR='10.0.0.5')
    assert client_ip(behind_azure) == '81.2.69.160'  # entry added by Azure, port removed


# ── Opening calendar (Coventry council dates + admin overrides) ──────────────

def test_backend_and_website_use_the_same_council_calendar():
    """apps/bookings/uk_calendar.py must list the same dates as frontend/lib/api/types.ts."""
    import re
    from pathlib import Path
    from apps.bookings.uk_calendar import SCHOOL_HOLIDAY_RANGES, UK_BANK_HOLIDAYS
    ts = (Path(__file__).resolve().parents[4] / 'frontend' / 'lib' / 'api' / 'types.ts').read_text(encoding='utf-8')
    ranges_block = ts[ts.index('const SCHOOL_HOLIDAY_RANGES'):ts.index('];', ts.index('const SCHOOL_HOLIDAY_RANGES'))]
    holidays_block = ts[ts.index('const UK_PUBLIC_HOLIDAYS'):ts.index('];', ts.index('const UK_PUBLIC_HOLIDAYS'))]
    ts_ranges = re.findall(r'\["(\d{4}-\d\d-\d\d)", "(\d{4}-\d\d-\d\d)"\]', ranges_block)
    ts_holidays = set(re.findall(r'"(\d{4}-\d\d-\d\d)"', holidays_block))
    assert ts_ranges == SCHOOL_HOLIDAY_RANGES
    assert ts_holidays == UK_BANK_HOLIDAYS


@pytest.mark.django_db
class TestOpeningCalendar:
    TERM_MONDAY = '2026-11-02'
    HALF_TERM_MONDAY = '2026-10-26'

    def days(self, start, end=None):
        response = APIClient().get('/api/v1/bookings/public/calendar/', {'start': start, 'end': end or start})
        assert response.status_code == 200
        return response.data

    def test_council_calendar(self, config):
        assert self.days(self.TERM_MONDAY)[0]['sessions_open'] is False
        half_term = self.days(self.HALF_TERM_MONDAY)[0]
        assert half_term['sessions_open'] and half_term['source'] == 'school_holiday'
        assert (half_term['open'], half_term['close']) == ('10:30', '18:00')
        assert self.days('2026-11-04')[0]['sessions_open'] is False      # term-time Wednesday
        assert self.days('2027-03-29')[0]['source'] == 'bank_holiday'   # Easter Monday

    def test_special_opening_opens_a_closed_day_with_its_own_hours(self, config, plans):
        from datetime import time
        from apps.bookings.models import BookingBlock
        BookingBlock.objects.create(start_date=self.TERM_MONDAY, end_date=self.TERM_MONDAY, type='OPEN_TODAY',
                                    reason='Inset day opening', open_time=time(12, 0), close_time=time(18, 0))
        day = self.days(self.TERM_MONDAY)[0]
        assert day['sessions_open'] and day['parties_open'] and (day['open'], day['close']) == ('12:00', '18:00')
        response = APIClient().post(SESSIONS_URL, session_payload(plans, date=self.TERM_MONDAY, time='12:00'), format='json')
        assert response.status_code == 201, response.data

    def test_closure_blocks_bookings(self, config, plans):
        from apps.bookings.models import BookingBlock
        saturday = next_saturday().isoformat()
        BookingBlock.objects.create(start_date=saturday, end_date=saturday, type='CLOSED', reason='Private hire')
        assert self.days(saturday)[0]['sessions_open'] is False
        response = APIClient().post(SESSIONS_URL, session_payload(plans, date=saturday), format='json')
        assert response.status_code == 400

    def test_parties_only_closure_keeps_sessions_open(self, config):
        from apps.bookings.models import BookingBlock
        saturday = next_saturday().isoformat()
        BookingBlock.objects.create(start_date=saturday, end_date=saturday, type='CLOSED', reason='Party room repairs',
                                    blocks_normal_bookings=False, blocks_party_bookings=True)
        day = self.days(saturday)[0]
        assert day['sessions_open'] is True and day['parties_open'] is False
        response = APIClient().post(PARTIES_URL, {
            'name': 'Party Parent', 'email': 'party@example.com', 'phone': '07700900123',
            'date': saturday, 'time': '12:00:00', 'kids': 10, 'adults': 2}, format='json')
        assert response.status_code == 400


# ── Booking numbers & payment tracking ───────────────────────────────────────

@pytest.mark.django_db
class TestBookingNumbers:
    def test_session_and_party_numbers_are_short_and_unique(self, config, plans):
        import re
        response = APIClient().post(SESSIONS_URL, session_payload(plans), format='json')
        assert response.status_code == 201, response.data
        number = response.data['booking_number']
        assert re.fullmatch(r'GK\d{6}', number)
        assert Booking.objects.get(pk=response.data['id']).booking_number == number
        party = PartyBooking.objects.create(name='P', email='p@example.com', phone='07700900123',
                                            date=next_saturday(), time='12:00', kids=10, adults=2, amount=0)
        assert re.fullmatch(r'GP\d{6}', party.booking_number)

    def test_customers_cannot_choose_the_booking_number(self, config, plans):
        response = APIClient().post(SESSIONS_URL, session_payload(plans, booking_number='GK000001'), format='json')
        assert response.status_code == 201
        assert response.data['booking_number'] != 'GK000001'

    def test_admin_finds_a_booking_by_its_number(self, config, plans, staff_client):
        number = APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data['booking_number']
        for typed in (number, number.lower(), f'#{number}', f'{number[:2]} {number[2:5]}-{number[5:]}'):
            response = staff_client.get(SESSIONS_URL, {'search': typed})
            results = response.data['results'] if isinstance(response.data, dict) else response.data
            assert [b['booking_number'] for b in results] == [number], typed

    def test_payments_show_and_search_by_booking_number(self, config, plans, staff_client):
        from apps.payments.models import Payment
        booking = Booking.objects.get(pk=APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data['id'])
        Payment.objects.create(booking=booking, provider='SUMUP', order_id='chk_1', amount=Decimal('19.90'),
                               currency='GBP', status='SUCCESS')
        Payment.objects.create(provider='SUMUP', order_id='chk_other', amount=Decimal('5'), currency='GBP')
        response = staff_client.get('/api/v1/payments/', {'search': booking.booking_number.lower()})
        assert response.status_code == 200
        assert [p['booking_number'] for p in response.data['results']] == [booking.booking_number]

    def test_payments_are_staff_only(self, db):
        client = APIClient()
        for url in ('/api/v1/payments/', '/api/v1/payments/stats/', '/api/v1/payments/1/'):
            assert client.get(url).status_code in (401, 403), url
        assert client.post('/api/v1/payments/refund/', {'payment_id': 1, 'amount': 1}, format='json').status_code in (401, 403)


# ── Audit fixes (Oct 2026) ───────────────────────────────────────────────────

PARTY_PAYLOAD = {'name': 'Party Parent', 'email': 'party@example.com', 'phone': '07700900123',
                 'time': '12:00:00', 'kids': 10, 'adults': 2}


@pytest.mark.django_db
class TestAuditFixes:
    def test_old_party_endpoint_cannot_create_bookings(self, config):
        response = APIClient().post('/api/v1/bookings/party-bookings-old/', {
            **PARTY_PAYLOAD, 'date': next_saturday().isoformat(), 'package_name': 'x',
            'amount': '0.01', 'paid_amount': '999'}, format='json')
        assert response.status_code == 401
        assert not PartyBooking.objects.exists()

    def test_party_slot_capacity_is_enforced(self, config):
        saturday = next_saturday().isoformat()
        big = {**PARTY_PAYLOAD, 'date': saturday, 'kids': 20, 'adults': 5}
        assert APIClient().post(PARTIES_URL, big, format='json').status_code == 201
        response = APIClient().post(PARTIES_URL, {**big, 'email': 'other@example.com'}, format='json')
        assert response.status_code == 409          # 25 + 25 > 30 guests in the 12:00 slot

    def test_public_availability_hides_party_names(self, config, staff_client):
        saturday = next_saturday().isoformat()
        APIClient().post(PARTIES_URL, {**PARTY_PAYLOAD, 'date': saturday}, format='json')
        url = SESSIONS_URL + 'slot_availability/'
        public = APIClient().get(url, {'date': saturday}).data['party_slots']['12:00']
        assert 'party_bookings' not in public and public['booked_count'] == 12
        assert staff_client.get(url, {'date': saturday}).data['party_slots']['12:00']['party_bookings']

    def test_unpaid_online_bookings_are_released(self, config, plans):
        from datetime import timedelta
        from django.utils import timezone
        from apps.bookings.unpaid import release_unpaid_bookings
        booking = Booking.objects.get(pk=APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data['id'])
        assert booking.online_checkout and booking.booking_status != 'CANCELLED'
        assert release_unpaid_bookings() == {'sessions': 0, 'parties': 0}       # still within 30 minutes
        Booking.objects.filter(pk=booking.pk).update(created_at=timezone.now() - timedelta(minutes=31))
        assert release_unpaid_bookings()['sessions'] == 1
        booking.refresh_from_db()
        assert booking.booking_status == 'CANCELLED'

    def test_paid_and_staff_bookings_are_never_released(self, config, plans, staff_client):
        from datetime import timedelta
        from django.utils import timezone
        from apps.bookings.unpaid import release_unpaid_bookings
        paid = Booking.objects.get(pk=APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data['id'])
        Booking.objects.filter(pk=paid.pk).update(paid_amount=paid.amount, payment_status='PAID')
        staff = staff_client.post(SESSIONS_URL, session_payload(plans, email='walkin@example.com', amount='12.95'), format='json')
        assert staff.status_code == 201, (staff.status_code, getattr(staff, 'data', None))
        Booking.objects.update(created_at=timezone.now() - timedelta(hours=2))
        assert release_unpaid_bookings()['sessions'] == 0
        assert not Booking.objects.get(pk=staff.data['id']).online_checkout

    def test_settings_can_pause_online_booking(self, config, plans):
        from apps.core.models import GlobalSettings
        site = GlobalSettings.objects.create(online_booking_enabled=False)
        response = APIClient().post(SESSIONS_URL, session_payload(plans), format='json')
        assert response.status_code == 400 and response.data['code'] == 'BOOKINGS_PAUSED'
        site.online_booking_enabled, site.party_bookings_enabled = True, False
        site.save()
        assert APIClient().post(SESSIONS_URL, session_payload(plans), format='json').status_code == 201
        party = APIClient().post(PARTIES_URL, {**PARTY_PAYLOAD, 'date': next_saturday().isoformat()}, format='json')
        assert party.data['code'] == 'BOOKINGS_PAUSED'

    def test_maintenance_mode_pauses_all_online_booking(self, config, plans):
        from apps.core.models import GlobalSettings
        GlobalSettings.objects.create(maintenance_mode=True)
        assert APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data['code'] == 'BOOKINGS_PAUSED'

    def test_migrations_endpoint_is_not_public(self, db):
        assert APIClient().post('/api/v1/core/settings/fix_db_schema/').status_code in (401, 403)
        assert APIClient().get('/api/v1/core/settings/fix_db_schema/').status_code in (401, 403, 405)


@pytest.mark.django_db
class TestInvitations:
    def make_party(self):
        return PartyBooking.objects.create(name='P', email='p@example.com', phone='07700900123',
                                           date=next_saturday(), time='12:00', kids=10, adults=2, amount=0)

    def test_invitations_are_not_listable_or_editable_publicly(self):
        from apps.invitations.models import BookingInvitation
        invitation = BookingInvitation.objects.create(booking=self.make_party(), child_name='Amélie')
        client = APIClient()
        assert client.get('/api/v1/invitations/invitations/').status_code == 401
        assert client.delete(f'/api/v1/invitations/invitations/{invitation.id}/').status_code == 401
        assert client.get(f'/api/v1/invitations/invitations/public/{invitation.uuid}/').status_code == 200

    def test_booker_creates_invitation_with_the_private_booking_reference(self):
        party = self.make_party()
        url = '/api/v1/invitations/invitations/create-or-update/'
        assert APIClient().post(url, {'booking_id': party.id, 'child_name': 'X'}, format='json').status_code == 400
        response = APIClient().post(url, {'booking_uuid': str(party.uuid), 'child_name': 'Amélie'}, format='json')
        assert response.status_code == 200 and response.data['child_name'] == 'Amélie'


@pytest.mark.django_db
class TestPaidAtVenue:
    def test_marking_a_party_paid_records_the_balance(self, config, staff_client):
        from apps.payments.models import Payment
        party = PartyBooking.objects.create(name='P', email='p@example.com', phone='07700900123', date=next_saturday(),
                                            time='12:00', kids=10, adults=2, amount=Decimal('299.90'),
                                            paid_amount=Decimal('149.95'), payment_status='PARTIAL')
        response = staff_client.post(f'/api/v1/bookings/party-bookings/{party.id}/update_status/',
                                     {'payment_status': 'PAID', 'booking_status': 'CONFIRMED'}, format='json')
        assert response.status_code == 200
        party.refresh_from_db()
        assert (party.paid_amount, party.payment_status, party.status) == (Decimal('299.90'), 'PAID', 'CONFIRMED')
        payment = Payment.objects.get(party_booking=party)
        assert (payment.provider, payment.status, payment.amount) == ('VENUE', 'SUCCESS', Decimal('149.95'))

    def test_invalid_party_status_is_rejected(self, staff_client):
        party = PartyBooking.objects.create(name='P', email='p@example.com', phone='1', date=next_saturday(),
                                            time='12:00', kids=10, adults=2, amount=0)
        assert staff_client.post(f'/api/v1/bookings/party-bookings/{party.id}/update_status/',
                                 {'status': 'NONSENSE'}, format='json').status_code == 400

    def test_walk_in_paid_at_desk_shows_in_payments(self, config, plans, staff_client):
        from apps.payments.models import Payment
        response = staff_client.post(SESSIONS_URL, session_payload(plans, amount='12.95', paid_amount='12.95',
                                                                   payment_status='PAID'), format='json')
        assert response.status_code == 201
        payment = Payment.objects.get(booking_id=response.data['id'])
        assert (payment.provider, payment.amount) == ('VENUE', Decimal('12.95'))


@pytest.mark.django_db
class TestCustomerSelfService:
    def signed_in(self, email):
        client = APIClient()
        token = client.post('/api/v1/bookings/customer-auth/register/',
                            {'name': 'Cust', 'email': email, 'password': 'secret-pass'}, format='json').data['token']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return client

    def test_my_bookings_lists_sessions_parties_and_event_reservations(self, config, plans):
        from datetime import time
        from apps.bookings.models import SpecialEvent
        # booked before the account existed, with different capitals in the e-mail
        APIClient().post(SESSIONS_URL, session_payload(plans, email='Fam@Example.com'), format='json')
        APIClient().post(PARTIES_URL, {**PARTY_PAYLOAD, 'email': 'fam@example.com', 'date': next_saturday().isoformat()},
                         format='json')
        event = SpecialEvent.objects.create(title='Halloween', slug='halloween', date=next_saturday(), start_time=time(14, 0),
                                            end_time=time(16, 0), status='PUBLISHED', total_capacity=20,
                                            price_per_child=Decimal('10.00'), price_per_adult=Decimal('5.00'))
        APIClient().post('/api/v1/bookings/public/events/book/', {'event_id': event.id, 'num_children': 1, 'num_adults': 1,
                         'name': 'Fam', 'email': 'FAM@example.com', 'phone': '07700900123'}, format='json')
        # those bookings exist, so signing up with the address can't simply open them
        claim = APIClient().post('/api/v1/bookings/customer-auth/register/',
                                 {'name': 'Someone', 'email': 'fam@example.com', 'password': 'secret-pass'}, format='json')
        assert claim.status_code == 409 and claim.data['code'] == 'CHECK_EMAIL' and 'token' not in claim.data
        # the owner sets a password from the e-mailed link
        from apps.bookings.customer_auth import make_password_reset_token
        from apps.bookings.models import CustomerToken
        link_token = make_password_reset_token(CustomerToken.objects.get(customer__email='fam@example.com'))
        reset = APIClient().post('/api/v1/bookings/customer-auth/reset-password/',
                                 {'token': link_token, 'password': 'owner-pass-123'}, format='json')
        assert reset.status_code == 200, reset.data
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {reset.data['token']}")
        rows = client.get('/api/v1/bookings/customer-auth/my-bookings/').data['bookings']
        assert sorted(r['type'] for r in rows) == ['EVENT', 'PARTY', 'SESSION']
        event_row = next(r for r in rows if r['type'] == 'EVENT')
        assert event_row['activity'] == 'Halloween' and event_row['event_slug'] == 'halloween'
        assert all(r['booking_number'] for r in rows)
        assert APIClient().get('/api/v1/bookings/customer-auth/my-bookings/').status_code == 401

    def test_customer_cannot_change_date_or_numbers(self, config, plans):
        client = self.signed_in('cust@example.com')
        booking_id = APIClient().post(SESSIONS_URL, session_payload(plans, email='cust@example.com'), format='json').data['id']
        url = f'/api/v1/bookings/customer-auth/booking/session/{booking_id}/'
        assert client.patch(url, {'kids': 20}, format='json').status_code == 400
        assert client.patch(url, {'date': '2026-11-04'}, format='json').status_code == 400
        booking = Booking.objects.get(pk=booking_id)
        assert booking.kids != 20

    def test_customer_updates_party_guest_list_and_cancels(self, config):
        from apps.core.models import Notification
        client = self.signed_in('party@example.com')
        party_id = APIClient().post(PARTIES_URL, {**PARTY_PAYLOAD, 'date': next_saturday().isoformat()}, format='json').data['id']
        url = f'/api/v1/bookings/customer-auth/booking/party/{party_id}/'
        guests = {'adults': [{'name': 'Mum'}], 'minors': [{'name': 'Amélie'}]}
        response = client.patch(url, {'participants': guests}, format='json')
        assert response.status_code == 200 and response.data['participants'] == guests
        assert client.patch(url, {'action': 'cancel'}, format='json').data['status'] == 'CANCELLED'
        assert Notification.objects.filter(title='Booking cancelled by customer').exists()

    def test_customer_cannot_open_someone_elses_booking(self, config, plans):
        booking_id = APIClient().post(SESSIONS_URL, session_payload(plans, email='owner@example.com'), format='json').data['id']
        intruder = self.signed_in('intruder@example.com')
        assert intruder.get(f'/api/v1/bookings/customer-auth/booking/session/{booking_id}/').status_code == 404


# ── Google reviews (Testimonies page) ────────────────────────────────────────

class _FakeResponse:
    def __init__(self, data, status=200):
        self.status_code, self._data = status, data

    def json(self):
        return self._data


GOOGLE_PLACE = {
    'id': 'ChIJgkp', 'rating': 4.6, 'userRatingCount': 812, 'googleMapsUri': 'https://maps.google.com/?cid=123',
    'reviews': [
        {'name': 'places/ChIJgkp/reviews/aaa', 'rating': 5, 'publishTime': '2026-09-14T10:00:00Z',
         'text': {'text': 'Brilliant soft play, the kids loved the go karts!'},
         'authorAttribution': {'displayName': 'Priya S', 'photoUri': 'https://lh3.googleusercontent.com/a/p.jpg',
                               'uri': 'https://www.google.com/maps/contrib/1'},
         'googleMapsUri': 'https://www.google.com/maps/reviews/aaa'},
        {'name': 'places/ChIJgkp/reviews/bbb', 'rating': 2, 'publishTime': '2026-08-01T10:00:00Z',
         'text': {'text': 'Too busy on Saturday.'}, 'authorAttribution': {'displayName': 'Tom'}},
        {'name': 'places/ChIJgkp/reviews/ccc', 'rating': 5, 'publishTime': '2026-07-01T10:00:00Z'},  # stars only
    ],
    'photos': [{'name': 'places/ChIJgkp/photos/p1', 'widthPx': 1600, 'heightPx': 1200,
                'authorAttributions': [{'displayName': 'Go Kids Play', 'uri': 'https://maps.google.com/u/1'}]}],
}


def _fake_google_get(url, *args, **kwargs):
    if url.endswith('/media'):
        return _FakeResponse({'photoUri': 'https://lh3.googleusercontent.com/p/photo1=w1600'})
    return _FakeResponse(GOOGLE_PLACE)


@pytest.fixture
def admin_client(db):
    user = get_user_model().objects.create_user(username='admin-test', email='admin-test@example.com',
                                                password='x-Test-12345', role='ADMIN')
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestGoogleReviews:
    def test_sync_imports_rating_and_reviews(self, settings, monkeypatch, admin_client):
        from apps.cms import google_reviews
        from apps.cms.models import GoogleReviewsProfile, Testimonial
        settings.GOOGLE_PLACES_API_KEY = 'test-key'
        monkeypatch.setattr(google_reviews.requests, 'post', lambda *a, **k: _FakeResponse(
            {'places': [{'id': 'ChIJgkp', 'googleMapsUri': 'https://maps.google.com/?cid=123'}]}))
        monkeypatch.setattr(google_reviews.requests, 'get', _fake_google_get)

        response = admin_client.post('/api/v1/cms/google-reviews/sync/')
        assert response.status_code == 200, response.data
        assert response.data['created'] == 2                       # the stars-only review is skipped
        profile = GoogleReviewsProfile.get()
        assert (profile.place_id, float(profile.rating), profile.review_count) == ('ChIJgkp', 4.6, 812)
        priya = Testimonial.objects.get(external_id='places/ChIJgkp/reviews/aaa')
        assert priya.active and priya.platform == 'Google' and priya.review_date == 'September 2026'
        assert not Testimonial.objects.get(external_id='places/ChIJgkp/reviews/bbb').active   # below 4★ starts hidden

        # Staff hide a review; a re-sync keeps it hidden and doesn't duplicate
        Testimonial.objects.filter(pk=priya.pk).update(active=False)
        admin_client.post('/api/v1/cms/google-reviews/sync/')
        assert Testimonial.objects.filter(platform='Google').count() == 2
        assert not Testimonial.objects.get(pk=priya.pk).active

        public = APIClient().get('/api/v1/cms/google-reviews/').data
        assert public['rating'] == 4.6 and public['review_count'] == 812
        assert public['write_review_url'] == 'https://search.google.com/local/writereview?placeid=ChIJgkp'
        assert 'last_error' not in public and 'place_id' not in public
        assert public['photos'] == [{'url': 'https://lh3.googleusercontent.com/p/photo1=w1600', 'width': 1600,
                                     'height': 1200, 'author': 'Go Kids Play', 'author_url': 'https://maps.google.com/u/1'}]

    def test_without_a_key_the_page_still_links_to_google(self, settings, admin_client):
        settings.GOOGLE_PLACES_API_KEY = ''
        assert admin_client.post('/api/v1/cms/google-reviews/sync/').status_code == 400
        public = APIClient().get('/api/v1/cms/google-reviews/').data
        assert public['rating'] is None and public['reviews_url'].startswith('https://www.google.com/maps/search/')

    def test_only_content_managers_change_settings(self, admin_client, staff_client):
        assert staff_client.post('/api/v1/cms/google-reviews/sync/').status_code == 403   # plain staff
        assert APIClient().patch('/api/v1/cms/google-reviews/', {'place_id': 'x'}, format='json').status_code == 403
        assert APIClient().post('/api/v1/cms/google-reviews/sync/').status_code in (401, 403)
        response = admin_client.patch('/api/v1/cms/google-reviews/', {'place_id': 'ChIJabc', 'min_rating_to_show': 3}, format='json')
        assert response.status_code == 200 and response.data['place_id'] == 'ChIJabc'


@pytest.mark.django_db
def test_party_must_start_at_a_party_time(config):
    from apps.cms.models import PartyBookingConfig
    PartyBookingConfig.objects.create(available_time_slots=['12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'])
    saturday = next_saturday().isoformat()
    bad = APIClient().post(PARTIES_URL, {**PARTY_PAYLOAD, 'date': saturday, 'time': '11:00'}, format='json')
    assert bad.status_code == 400 and bad.data['code'] == 'INVALID_TIME'
    assert bad.data['times'] == ['12:00', '14:00', '16:00']     # 6pm would end after closing
    assert APIClient().post(PARTIES_URL, {**PARTY_PAYLOAD, 'date': saturday, 'time': '2:00 PM'}, format='json').status_code == 201


# ── Admin global search (header search box) ──────────────────────────────────

@pytest.mark.django_db
class TestGlobalSearch:
    URL = '/api/v1/core/admin/search/'

    def types(self, client, q):
        response = client.get(self.URL, {'q': q})
        assert response.status_code == 200, response.data
        return response.data['results']

    def test_finds_bookings_by_number_phone_and_date(self, config, plans, admin_client):
        booking = APIClient().post(SESSIONS_URL, session_payload(plans, phone='07700 900123'), format='json').data
        number = booking['booking_number']
        for q in (number.lower(), f'{number[:2]} {number[2:5]} {number[5:]}', '07700900123', '900 123'):
            results = self.types(admin_client, q)
            assert any(r['type'] == 'booking' and number in r['title'] for r in results), q
        day = date.fromisoformat(booking['date'])
        results = self.types(admin_client, f'{day.day}/{day.month}')
        assert any(r['type'] == 'booking' for r in results)

    def test_finds_customers_screens_and_events(self, config, plans, admin_client):
        APIClient().post(SESSIONS_URL, session_payload(plans, name='Priya Sharma', email='priya@example.com'), format='json')
        assert any(r['type'] == 'customer' for r in self.types(admin_client, 'priya'))
        screens = [r for r in self.types(admin_client, 'opening hours') if r['type'] == 'screen']
        assert any(r['route'] == '/admin/cms/session-booking' for r in screens)

    def test_routes_point_at_real_admin_pages(self, config, admin_client):
        from apps.cms.models import ContactMessage
        ContactMessage.objects.create(name='Search Test', email='search@example.com', message='Are you open on Monday?')
        result = next(r for r in self.types(admin_client, 'search test') if r['type'] == 'message')
        assert result['route'].startswith('/admin/cms/contact-messages/')

    def test_search_needs_a_signed_in_admin(self, db):
        assert APIClient().get(self.URL, {'q': 'GK'}).status_code in (401, 403)


# ── Admin activity log ───────────────────────────────────────────────────────

@pytest.mark.django_db
class TestActivityLog:
    def test_admin_changes_are_recorded(self, config, admin_client):
        from apps.core.models import AdminActivity
        saturday = next_saturday().isoformat()
        created = admin_client.post('/api/v1/bookings/booking-blocks/', {
            'start_date': saturday, 'end_date': saturday, 'type': 'CLOSED', 'reason': 'Private hire',
            'blocks_normal_bookings': True, 'blocks_party_bookings': True}, format='json')
        assert created.status_code == 201
        admin_client.patch(f"/api/v1/bookings/booking-blocks/{created.data['id']}/", {'reason': 'Private party'}, format='json')
        admin_client.delete(f"/api/v1/bookings/booking-blocks/{created.data['id']}/")
        log = list(AdminActivity.objects.order_by('id').values_list('action', 'entity', 'entity_id'))
        assert log == [('CREATE', 'Opening day change', str(created.data['id'])),
                       ('UPDATE', 'Opening day change', str(created.data['id'])),
                       ('DELETE', 'Opening day change', str(created.data['id']))]
        update = AdminActivity.objects.get(action='UPDATE')
        assert update.user_email == 'admin-test@example.com' and update.details['fields'] == {'reason': 'Private party'}

    def test_actions_and_booking_numbers_are_described(self, config, admin_client):
        from apps.core.models import AdminActivity
        party = PartyBooking.objects.create(name='P', email='p@example.com', phone='1', date=next_saturday(),
                                            time='12:00', kids=10, adults=2, amount=Decimal('299.90'))
        admin_client.post(f'/api/v1/bookings/party-bookings/{party.id}/update_status/', {'payment_status': 'PAID'}, format='json')
        entry = AdminActivity.objects.get()
        assert (entry.action, entry.entity) == ('ACTION', 'Party booking')
        assert entry.summary.startswith('Update status party booking')

    def test_customer_bookings_and_failed_logins(self, config, plans):
        from apps.core.models import AdminActivity
        APIClient().post(SESSIONS_URL, session_payload(plans), format='json')     # a customer, not an admin change
        assert not AdminActivity.objects.exists()
        APIClient().post('/api/token/', {'email': 'nobody@example.com', 'password': 'wrong'}, format='json')
        failed = AdminActivity.objects.get()
        assert (failed.action, failed.user_email) == ('LOGIN_FAILED', 'nobody@example.com')

    def test_passwords_are_never_stored(self, admin_client):
        from apps.core.models import AdminActivity
        admin_client.post('/api/v1/core/users/', {'email': 'new@example.com', 'username': 'new', 'name': 'New',
                                                  'password': 'Secret-123456', 'role': 'STAFF'}, format='json')
        for entry in AdminActivity.objects.all():
            assert 'Secret-123456' not in str(entry.details)

    def test_only_managers_read_the_log(self, staff_client, admin_client):
        assert staff_client.get('/api/v1/core/activity-logs/').status_code == 403
        assert admin_client.get('/api/v1/core/activity-logs/').status_code == 200



@pytest.mark.django_db
class TestScheduledJobs:
    URL = '/api/v1/core/cron/'

    def test_needs_the_secret(self, settings):
        settings.CRON_SECRET = 'cron-secret-for-tests'
        assert APIClient().post(self.URL).status_code == 403
        assert APIClient().post(self.URL, HTTP_X_CRON_SECRET='wrong').status_code == 403
        settings.CRON_SECRET = ''
        assert APIClient().post(self.URL, HTTP_X_CRON_SECRET='').status_code == 403   # never open without a secret

    def test_frequent_job_releases_unpaid_bookings(self, settings, config, plans):
        from datetime import timedelta
        from django.utils import timezone
        settings.CRON_SECRET = 'cron-secret-for-tests'
        booking_id = APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data['id']
        Booking.objects.filter(pk=booking_id).update(created_at=timezone.now() - timedelta(hours=1))
        response = APIClient().post(self.URL + '?job=frequent', HTTP_X_CRON_SECRET='cron-secret-for-tests')
        assert response.status_code == 200, response.data
        assert Booking.objects.get(pk=booking_id).booking_status == 'CANCELLED'

    def test_daily_job_runs(self, settings, db):
        settings.CRON_SECRET = 'cron-secret-for-tests'
        settings.GOOGLE_PLACES_API_KEY = ''
        response = APIClient().post(self.URL + '?job=daily', HTTP_X_CRON_SECRET='cron-secret-for-tests')
        assert response.status_code == 200 and 'send_post_visit_emails' in response.data['results']


# ── Payments end to end with the mock gateway (PAYMENT_MODE=mock) ───────────

@pytest.fixture
def mock_payments(settings, monkeypatch):
    from apps.payments.gateways.mock import MockPaymentGateway
    from apps.payments.services import payment_service
    settings.DEBUG = True
    settings.PAYMENT_MODE = 'mock'
    settings.FRONTEND_URL = 'http://localhost:5000'
    monkeypatch.setattr(payment_service, 'gateway', MockPaymentGateway())
    return payment_service


@pytest.mark.django_db
class TestMockPayments:
    def checkout(self, booking_id, booking_type='session', amount=None):
        body = {'booking_id': booking_id, 'booking_type': booking_type}
        if amount is not None:
            body['amount'] = amount
        return APIClient().post('/api/v1/payments/create-order/', body, format='json')

    def pay(self, order, result='pay'):
        path = order['checkout_url'].split('localhost:9000')[-1]
        client = APIClient(enforce_csrf_checks=False)
        assert client.get(path).status_code == 200            # the test checkout page
        redirect = client.post(path, {'result': result})
        assert redirect.status_code == 302 and redirect['Location'].startswith('http://localhost:5000/book/success?')
        return APIClient().post('/api/v1/payments/verify/', {'order_id': order['order_id']}, format='json').data

    def test_session_booking_paid_in_full(self, config, plans, mock_payments):
        from apps.payments.models import Payment
        booking = APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data
        order = self.checkout(booking['id'], amount='0.01').data      # the browser can't choose the amount
        assert Decimal(str(order['amount'])) == Decimal(booking['amount'])
        result = self.pay(order)
        assert result['payment_status'] == 'PAID'
        saved = Booking.objects.get(pk=booking['id'])
        assert (saved.payment_status, saved.booking_status, saved.paid_amount) == ('PAID', 'CONFIRMED', saved.amount)
        # Verifying again (success page + webhook) doesn't count the money twice
        APIClient().post('/api/v1/payments/verify/', {'order_id': order['order_id']}, format='json')
        assert Booking.objects.get(pk=booking['id']).paid_amount == saved.amount
        assert Payment.objects.get(order_id=order['order_id']).status == 'SUCCESS'
        assert self.checkout(booking['id']).status_code == 400          # can't pay twice

    def test_declined_payment_is_reported_straight_away(self, config, plans, mock_payments):
        booking = APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data
        result = self.pay(self.checkout(booking['id']).data, result='decline')
        assert result['payment_status'] == 'FAILED'
        assert Booking.objects.get(pk=booking['id']).payment_status == 'PENDING'

    def test_party_deposit_then_balance(self, config, mock_payments):
        party = APIClient().post(PARTIES_URL, {**PARTY_PAYLOAD, 'date': next_saturday().isoformat()}, format='json').data
        saved = PartyBooking.objects.get(pk=party['id'])
        deposit = self.checkout(party['id'], 'party', amount=str(saved.deposit_amount)).data
        assert Decimal(str(deposit['amount'])) == saved.deposit_amount
        assert self.pay(deposit)['payment_status'] == 'PARTIAL'
        saved.refresh_from_db()
        assert (saved.status, saved.paid_amount) == ('DEPOSIT_PAID', saved.deposit_amount)
        balance = self.checkout(party['id'], 'party', amount='1.00').data      # always the balance due
        assert Decimal(str(balance['amount'])) == saved.amount - saved.deposit_amount
        assert self.pay(balance)['payment_status'] == 'PAID'
        saved.refresh_from_db()
        assert (saved.status, saved.payment_status, saved.paid_amount) == ('CONFIRMED', 'PAID', saved.amount)

    def test_cancelled_booking_cannot_be_paid(self, config, plans, mock_payments):
        booking = APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data
        Booking.objects.filter(pk=booking['id']).update(booking_status='CANCELLED')
        response = self.checkout(booking['id'])
        assert response.status_code == 400 and 'cancelled' in str(response.data).lower()

    def test_refund_goes_back_to_the_booking(self, config, plans, mock_payments, admin_client):
        from apps.payments.models import Payment
        booking = APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data
        order = self.checkout(booking['id']).data
        self.pay(order)
        payment = Payment.objects.get(order_id=order['order_id'])
        response = admin_client.post('/api/v1/payments/refund/', {'payment_id': payment.id, 'reason': 'Test'}, format='json')
        assert response.status_code == 200, response.data
        assert Booking.objects.get(pk=booking['id']).payment_status == 'REFUNDED'

    def test_mock_checkout_is_off_on_the_live_site(self, settings, config, plans, mock_payments):
        booking = APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data
        order = self.checkout(booking['id']).data
        settings.DEBUG = False
        assert APIClient().get(order['checkout_url'].split('localhost:9000')[-1]).status_code == 404
