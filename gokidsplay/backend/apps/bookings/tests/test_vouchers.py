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


# ── Buy X Get Y Free ─────────────────────────────────────────────────────────

def bogo(code='B2G1', buy=2, free=1, **fields):
    return make_voucher(code=code, discount_type='BUY_X_GET_Y', discount_value=Decimal('0'), buy_quantity=buy,
                        free_quantity=free, **{'applies_to': 'SESSION', **fields})


def people(*prices):
    return [(f'Ticket {p}', Decimal(p)) for p in prices]


@pytest.mark.django_db
class TestBuyXGetYFree:
    @pytest.mark.parametrize('count, free', [(2, 0), (3, 1), (4, 1), (5, 1), (6, 2), (8, 2), (9, 3)])
    def test_every_full_group_of_three_gets_one_free(self, count, free):
        bogo()
        result = evaluate_voucher('B2G1', Decimal('12.95') * count, kind='session', items=people(*['12.95'] * count))
        if free == 0:
            assert not result.valid and 'needs at least 3 tickets' in result.error
        else:
            assert result.valid and result.discount == Decimal('12.95') * free
            assert result.summary == f'Buy 2 Get 1 Free: {count} tickets, {free} free'
            assert result.free_items == [{'label': 'Ticket 12.95', 'qty': free, 'price_each': 12.95,
                                          'total': float(Decimal('12.95') * free)}]

    def test_the_cheapest_tickets_are_the_free_ones(self):
        bogo(code='B1G1', buy=1, free=1)
        result = evaluate_voucher('B1G1', Decimal('41.80'), kind='session',
                                  items=people('12.95', '12.95', '7.95', '7.95', '1.95'))
        # 5 people, Buy 1 Get 1: 2 free, the two cheapest (1.95 and 7.95)
        assert result.discount == Decimal('9.90')
        assert [(i['label'], i['qty']) for i in result.free_items] == [('Ticket 1.95', 1), ('Ticket 7.95', 1)]

    def test_cap_and_session_only(self):
        bogo(max_discount_amount=Decimal('10'))
        assert evaluate_voucher('B2G1', Decimal('77.70'), kind='session', items=people(*['12.95'] * 6)).discount == Decimal('10.00')
        assert 'play session' in evaluate_voucher('B2G1', Decimal('250'), kind='party').error
        assert 'choose your tickets' in evaluate_voucher('B2G1', Decimal('40'), kind='session').error

    def test_booking_is_charged_with_the_free_tickets_taken_off(self, config, plans):
        bogo()
        response = APIClient().post(SESSIONS_URL, {**session_payload(plans), 'voucher_code': 'b2g1'}, format='json')
        assert response.status_code == 201, response.data
        booking = Booking.objects.get(pk=response.data['id'])
        # 3 x 12.95 + 7.95 + 2 x 4.95 = 56.70; 6 people → 2 free, the two £4.95 adults = 9.90; + £2 fee
        assert booking.discount_amount == Decimal('9.90') and booking.amount == Decimal('48.80')
        free = {line['label']: line.get('free', 0) for line in booking.tickets}
        assert free == {'24 months and above': 0, 'Under 24 months': 0, 'Non-playing Adult': 2}
        assert VoucherRedemption.objects.get(booking=booking).discount_amount == Decimal('9.90')

    def test_apply_code_check_shows_what_was_free(self, config, plans):
        bogo()
        check = lambda tickets: APIClient().post(VOUCHERS_URL + 'validate/', {
            'code': 'b2g1', 'order_amount': 1, 'booking_type': 'session', 'tickets': tickets}, format='json').data
        three_kids = check({plans['child'].id: 3})
        assert three_kids['valid'] and three_kids['discount_amount'] == 12.95 and three_kids['final_amount'] == 25.9
        assert three_kids['summary'] == 'Buy 2 Get 1 Free: 3 tickets, 1 free'
        assert three_kids['free_items'][0]['label'] == '24 months and above'
        assert check({plans['child'].id: 2})['valid'] is False
        assert check({str(plans['child'].id): 6})['discount_amount'] == 25.9     # 4 pay, 2 free

    def test_party_booking_refuses_it(self, config):
        bogo(applies_to='ALL')
        response = APIClient().post(PARTIES_URL, party_payload(voucher_code='B2G1'), format='json')
        assert response.status_code == 400 and not PartyBooking.objects.exists()

    def test_admin_creates_and_switches_offer_types(self, admin_client):
        bad = admin_client.post(VOUCHERS_URL, {'code': 'B2G1', 'discount_type': 'BUY_X_GET_Y', 'buy_quantity': 2},
                                format='json')
        assert bad.status_code == 400 and 'free_quantity' in bad.data
        ok = admin_client.post(VOUCHERS_URL, {'code': 'b2g1', 'discount_type': 'BUY_X_GET_Y', 'buy_quantity': 2,
                                              'free_quantity': 1, 'applies_to': 'ALL'}, format='json')
        assert ok.status_code == 201, ok.data
        assert (ok.data['offer'], ok.data['applies_to'], ok.data['discount_value']) == ('Buy 2 Get 1 Free', 'SESSION', '0.00')
        switched = admin_client.patch(f"{VOUCHERS_URL}{ok.data['id']}/", {'discount_type': 'PERCENTAGE',
                                                                           'discount_value': '20'}, format='json')
        assert switched.status_code == 200 and switched.data['buy_quantity'] is None and switched.data['offer'] == '20% off'
        assert admin_client.post(VOUCHERS_URL, {'code': 'NOVALUE', 'discount_type': 'FLAT'}, format='json').status_code == 400
        batch = admin_client.post(VOUCHERS_URL + 'generate/', {'prefix': 'fam', 'count': 3, 'discount_type': 'BUY_X_GET_Y',
                                                               'buy_quantity': 3, 'free_quantity': 1}, format='json')
        assert batch.status_code == 201, batch.data
        assert {(v.buy_quantity, v.free_quantity, v.applies_to) for v in Voucher.objects.filter(batch=batch.data['batch'])} \
            == {(3, 1, 'SESSION')}
