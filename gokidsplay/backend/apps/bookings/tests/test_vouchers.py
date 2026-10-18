"""
Voucher rules, use tracking and the admin voucher API.

Vouchers are applied by the server when a booking is priced; every use is a
VoucherRedemption, given back if the booking is cancelled.
"""
from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from apps.bookings.models import Booking, PartyBooking
from apps.shop.models import Voucher, VoucherRedemption
from apps.shop.services import evaluate_voucher

from .test_booking_security import (  # noqa: F401 (fixtures)
    PARTIES_URL, PARTY_PAYLOAD, SESSIONS_URL, admin_client, config, next_saturday, plans, session_payload,
    staff_client,
)

VOUCHERS_URL = '/api/v1/shop/vouchers/'


def make_voucher(code='SAVE10', **fields):
    defaults = {'discount_type': 'PERCENTAGE', 'discount_value': Decimal('10'), 'is_active': True}
    defaults.update(fields)
    return Voucher.objects.create(code=code, **defaults)


def party_payload(**overrides):
    return {**PARTY_PAYLOAD, 'date': next_saturday().isoformat(), **overrides}


# ── Rules ────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestVoucherRules:
    def test_percentage_discount_is_capped(self):
        make_voucher(discount_value=Decimal('50'), max_discount_amount=Decimal('2.00'))
        result = evaluate_voucher('save10', Decimal('40'))
        assert result.valid and result.discount == Decimal('2.00')

    def test_flat_discount_never_exceeds_order(self):
        make_voucher(discount_type='FLAT', discount_value=Decimal('25'))
        assert evaluate_voucher('SAVE10', Decimal('10')).discount == Decimal('10.00')

    def test_not_valid_before_start_date(self):
        make_voucher(valid_from=timezone.now() + timedelta(days=2))
        result = evaluate_voucher('SAVE10', Decimal('40'))
        assert not result.valid and 'can be used from' in result.error

    def test_expired_and_inactive(self):
        make_voucher(code='OLD', expiry_date=timezone.now() - timedelta(minutes=1))
        make_voucher(code='OFF', is_active=False)
        assert evaluate_voucher('OLD', Decimal('40')).error == 'This voucher has expired'
        assert not evaluate_voucher('OFF', Decimal('40')).valid

    def test_sessions_or_parties_only(self):
        make_voucher(applies_to='PARTY')
        assert not evaluate_voucher('SAVE10', Decimal('40'), kind='session').valid
        assert evaluate_voucher('SAVE10', Decimal('40'), kind='party').valid

    def test_minimum_spend(self):
        make_voucher(min_order_amount=Decimal('30'))
        assert not evaluate_voucher('SAVE10', Decimal('29.99')).valid
        assert evaluate_voucher('SAVE10', Decimal('30')).valid

    def test_book_hours_ahead(self):
        make_voucher(min_hours_before_slot=48)
        soon = (timezone.now() + timedelta(hours=5)).isoformat()
        later = (timezone.now() + timedelta(days=5)).isoformat()
        assert not evaluate_voucher('SAVE10', Decimal('40'), soon).valid
        assert evaluate_voucher('SAVE10', Decimal('40'), later).valid


# ── Use tracking on real bookings ────────────────────────────────────────────

@pytest.mark.django_db
class TestVoucherUses:
    def test_session_use_is_recorded_released_and_restored(self, config, plans):
        voucher = make_voucher(usage_limit=5)
        response = APIClient().post(SESSIONS_URL, session_payload(plans, voucher_code='save10'), format='json')
        assert response.status_code == 201, response.data
        booking = Booking.objects.get(id=response.data['id'])
        use = VoucherRedemption.objects.get(voucher=voucher)
        assert (use.booking_id, use.email, use.discount_amount) == (booking.id, 'parent@example.com', Decimal('5.67'))
        voucher.refresh_from_db()
        assert voucher.used_count == 1

        booking.booking_status = 'CANCELLED'
        booking.save()
        voucher.refresh_from_db()
        use.refresh_from_db()
        assert voucher.used_count == 0 and use.released

        booking.save()  # saving again while cancelled doesn't release twice
        voucher.refresh_from_db()
        assert voucher.used_count == 0

        booking.booking_status = 'CONFIRMED'
        booking.save()
        voucher.refresh_from_db()
        use.refresh_from_db()
        assert voucher.used_count == 1 and not use.released

    def test_usage_limit_is_enforced(self, config, plans):
        make_voucher(usage_limit=1)
        first = APIClient().post(SESSIONS_URL, session_payload(plans, voucher_code='SAVE10'), format='json')
        assert first.status_code == 201, first.data
        second = APIClient().post(SESSIONS_URL, session_payload(plans, voucher_code='SAVE10', email='b@example.com'),
                                  format='json')
        assert second.status_code == 400
        assert Booking.objects.count() == 1

    def test_one_use_per_customer(self, config, plans):
        make_voucher(max_uses_per_customer=1)
        payload = session_payload(plans, voucher_code='SAVE10')
        assert APIClient().post(SESSIONS_URL, payload, format='json').status_code == 201
        again = APIClient().post(SESSIONS_URL, {**payload, 'email': 'PARENT@example.com'}, format='json')
        assert again.status_code == 400
        other = APIClient().post(SESSIONS_URL, {**payload, 'email': 'someone@example.com'}, format='json')
        assert other.status_code == 201

    def test_party_only_voucher_is_refused_for_sessions(self, config, plans):
        make_voucher(applies_to='PARTY')
        response = APIClient().post(SESSIONS_URL, session_payload(plans, voucher_code='SAVE10'), format='json')
        assert response.status_code == 400
        assert not VoucherRedemption.objects.exists()

    def test_party_voucher_discounts_total_and_deposit(self, config):
        plain = APIClient().post(PARTIES_URL, party_payload(), format='json')
        assert plain.status_code == 201, plain.data
        full = PartyBooking.objects.get(id=plain.data['id'])

        voucher = make_voucher(code='PARTY20', discount_type='FLAT', discount_value=Decimal('20'), applies_to='PARTY')
        response = APIClient().post(PARTIES_URL, party_payload(voucher_code='party20', email='p2@example.com'),
                                    format='json')
        assert response.status_code == 201, response.data
        party = PartyBooking.objects.get(id=response.data['id'])
        assert party.voucher_id == voucher.id and party.discount_amount == Decimal('20.00')
        assert party.amount == full.amount - Decimal('20.00')
        assert party.deposit_amount < full.deposit_amount
        assert VoucherRedemption.objects.get(voucher=voucher).party_booking_id == party.id

        party.status = 'CANCELLED'
        party.save()
        voucher.refresh_from_db()
        assert voucher.used_count == 0

    def test_invalid_party_voucher_is_rejected(self, config):
        response = APIClient().post(PARTIES_URL, party_payload(voucher_code='NOPE'), format='json')
        assert response.status_code == 400 and response.data['code'] == 'INVALID_VOUCHER'
        assert not PartyBooking.objects.exists()


# ── Public check + admin API ─────────────────────────────────────────────────

@pytest.mark.django_db
class TestVoucherApi:
    def test_public_check_respects_booking_type_and_email(self, config):
        make_voucher(applies_to='SESSION', max_uses_per_customer=1)
        check = lambda **extra: APIClient().post(VOUCHERS_URL + 'validate/',
                                                 {'code': 'save10', 'order_amount': 40, **extra}, format='json').data
        assert check(booking_type='session')['discount_amount'] == 4.0
        assert check(booking_type='party')['valid'] is False

    def test_public_check_is_rate_limited(self):
        make_voucher()
        client = APIClient()
        codes = [client.post(VOUCHERS_URL + 'validate/', {'code': f'GUESS{i}', 'order_amount': 10}, format='json')
                 .status_code for i in range(12)]
        assert codes[:10] == [200] * 10 and codes[-1] == 429

    def test_only_admins_manage_vouchers(self, staff_client, admin_client):
        assert staff_client.get(VOUCHERS_URL).status_code == 403
        assert admin_client.get(VOUCHERS_URL).status_code == 200

    def test_admin_create_validates(self, admin_client):
        bad = admin_client.post(VOUCHERS_URL, {'code': 'x', 'discount_type': 'PERCENTAGE', 'discount_value': '150'},
                                format='json')
        assert bad.status_code == 400 and 'code' in bad.data
        bad = admin_client.post(VOUCHERS_URL, {'code': 'summer-10', 'discount_type': 'PERCENTAGE',
                                               'discount_value': '150'}, format='json')
        assert bad.status_code == 400 and 'discount_value' in bad.data
        ok = admin_client.post(VOUCHERS_URL, {'code': 'summer-10', 'discount_type': 'PERCENTAGE',
                                              'discount_value': '15', 'used_count': 99,
                                              'valid_from': (timezone.now() + timedelta(days=1)).isoformat()},
                               format='json')
        assert ok.status_code == 201, ok.data
        assert ok.data['code'] == 'SUMMER-10' and ok.data['used_count'] == 0 and ok.data['status'] == 'Scheduled'
        dup = admin_client.post(VOUCHERS_URL, {'code': 'Summer-10', 'discount_type': 'FLAT', 'discount_value': '5'},
                                format='json')
        assert dup.status_code == 400

    def test_generate_single_use_codes(self, admin_client, staff_client):
        body = {'prefix': 'xmas', 'count': 25, 'discount_type': 'FLAT', 'discount_value': '5', 'applies_to': 'SESSION'}
        assert staff_client.post(VOUCHERS_URL + 'generate/', body, format='json').status_code == 403
        assert admin_client.post(VOUCHERS_URL + 'generate/', {**body, 'count': 501}, format='json').status_code == 400
        response = admin_client.post(VOUCHERS_URL + 'generate/', body, format='json')
        assert response.status_code == 201, response.data
        codes = response.data['codes']
        assert len(set(codes)) == 25 and all(c.startswith('XMAS-') for c in codes)
        made = Voucher.objects.filter(batch=response.data['batch'])
        assert made.count() == 25
        assert set(made.values_list('usage_limit', 'applies_to', 'discount_value')) == {(1, 'SESSION', Decimal('5.00'))}

    def test_redemption_history(self, admin_client, config, plans):
        voucher = make_voucher()
        booking_id = APIClient().post(SESSIONS_URL, session_payload(plans, voucher_code='SAVE10'), format='json').data['id']
        rows = admin_client.get(f'{VOUCHERS_URL}{voucher.id}/redemptions/').data
        booking = Booking.objects.get(id=booking_id)
        assert len(rows) == 1
        assert rows[0]['booking_number'] == booking.booking_number and rows[0]['booking_type'] == 'session'
        listed = admin_client.get(f'{VOUCHERS_URL}{voucher.id}/').data
        assert listed['total_discount_given'] == 5.67


def test_staff_user_model_has_roles():
    """Guard: the admin fixture relies on the role field."""
    assert 'role' in {f.name for f in get_user_model()._meta.fields}
