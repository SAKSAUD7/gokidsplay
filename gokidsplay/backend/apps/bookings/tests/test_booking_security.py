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
from apps.bookings.pricing import price_party_booking, price_session_booking
from apps.cms.models import ContactMessage, SessionBookingConfig
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
def staff_client(db):
    user = get_user_model().objects.create_user(
        username='staff-test', email='staff-test@example.com', password='x-Test-12345', is_staff=True
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def session_payload(**overrides):
    payload = {
        'name': 'Test Parent', 'email': 'parent@example.com', 'phone': '07700900123',
        'date': next_saturday().isoformat(), 'time': '14:00', 'duration': 120,
        'adults': 2, 'kids': 5, 'spectators': 0, 'type': 'SESSION',
    }
    payload.update(overrides)
    return payload


# ── Pricing ──────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestSessionPricing:
    def test_price_matches_booking_wizard_formula(self, config):
        price = price_session_booking(adults=2, kids=5, spectators=1, add_ons=[{'id': 'parking', 'qty': 1}])
        # 7 × 9.95 + 1 × 2.95 + parking 3.00 = 75.60, + £2 online fee
        assert price.subtotal == Decimal('75.60')
        assert price.amount == Decimal('77.60')

    def test_client_add_on_prices_are_ignored(self, config):
        price = price_session_booking(adults=1, kids=0, spectators=0,
                                      add_ons=[{'id': 'parking', 'qty': 2, 'price_each': 0}, {'id': 'free-stuff', 'qty': 9}])
        assert price.subtotal == Decimal('15.95')  # 9.95 + 2 × 3.00, unknown add-on dropped

    def test_staff_bookings_have_no_online_fee(self, config):
        price = price_session_booking(adults=1, kids=0, spectators=0, include_online_fee=False)
        assert price.amount == Decimal('9.95')


@pytest.mark.django_db
class TestPartyPricing:
    def test_base_package_covers_ten_kids_and_ten_adults(self):
        assert price_party_booking(kids=10, adults=10).amount == Decimal('250.00')

    def test_extra_guests_and_deposit(self):
        price = price_party_booking(kids=12, adults=12)
        assert price.amount == Decimal('295.80')   # 250 + 2 × 19.95 + 2 × 2.95
        assert price.deposit == Decimal('147.90')


# ── Public session bookings ──────────────────────────────────────────────────

@pytest.mark.django_db
class TestPublicSessionBooking:
    def test_forged_amount_and_payment_status_are_ignored(self, config):
        response = APIClient().post(SESSIONS_URL, session_payload(
            amount='0.01', subtotal='0.01', paid_amount='999', payment_status='PAID'
        ), format='json')
        assert response.status_code == 201, response.data
        booking = Booking.objects.get(id=response.data['id'])
        assert booking.amount == Decimal('71.65')     # 7 × 9.95 + £2 fee
        assert booking.paid_amount == Decimal('0')
        assert booking.payment_status == 'PENDING'

    def test_invalid_voucher_is_rejected(self, config):
        response = APIClient().post(SESSIONS_URL, session_payload(voucher_code='NOT-REAL'), format='json')
        assert response.status_code == 400
        assert Booking.objects.count() == 0

    def test_valid_voucher_discounts_and_counts_usage(self, config):
        voucher = Voucher.objects.create(code='SAVE10', discount_type='PERCENTAGE', discount_value=Decimal('10'),
                                         is_active=True, usage_limit=5, used_count=0)
        response = APIClient().post(SESSIONS_URL, session_payload(voucher_code='save10'), format='json')
        assert response.status_code == 201, response.data
        booking = Booking.objects.get(id=response.data['id'])
        assert booking.discount_amount == Decimal('6.97')   # 10% of 69.65 subtotal
        assert booking.amount == Decimal('64.68')
        voucher.refresh_from_db()
        assert voucher.used_count == 1

    def test_staff_can_set_custom_amount(self, config, staff_client):
        response = staff_client.post(SESSIONS_URL, session_payload(amount='5.00'), format='json')
        assert response.status_code == 201, response.data
        assert Booking.objects.get(id=response.data['id']).amount == Decimal('5.00')

    def test_admin_booking_list_works_with_bookings(self, config, staff_client):
        APIClient().post(SESSIONS_URL, session_payload(), format='json')
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
        assert party.amount == Decimal('289.90')
        assert party.deposit_amount == Decimal('144.95')
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
