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
        'date': next_saturday().isoformat(), 'time': '14:00', 'duration': 120, 'type': 'SESSION',
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

    def test_admin_booking_list_works_with_bookings(self, config, plans, staff_client):
        APIClient().post(SESSIONS_URL, session_payload(plans), format='json')
        assert staff_client.get(SESSIONS_URL).status_code == 200


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
            'name': 'A', 'email': 'a@example.com', 'phone': '07700900123'}, format='json')
        assert response.status_code == 400

    def test_event_price_is_calculated_on_server(self):
        from apps.bookings.models import EventBooking
        event = self.make_event()
        response = APIClient().post('/api/v1/bookings/public/events/book/', {
            'event_id': event.id, 'num_children': 2, 'num_adults': 1, 'subtotal': '0.01',
            'name': 'A', 'email': 'a@example.com', 'phone': '07700900123'}, format='json')
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
