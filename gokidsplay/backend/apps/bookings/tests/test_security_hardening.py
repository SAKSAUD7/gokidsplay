"""
Site-wide security rules: private-by-default API, staff-only marketing and
payment tools, login rate limits, CSRF on cookie sign-in.
"""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.shop.models import Voucher, VoucherRedemption

from .test_booking_security import (  # noqa: F401 (fixtures)
    SESSIONS_URL, admin_client, config, plans, session_payload, staff_client,
)


@pytest.mark.django_db
class TestPrivateByDefault:
    def test_marketing_is_staff_only(self, staff_client):
        anon = APIClient()
        assert anon.get('/api/v1/marketing/marketing-campaigns/').status_code == 401
        assert anon.post('/api/v1/marketing/marketing-campaigns/', {'title': 'x'}, format='json').status_code == 401
        assert anon.post('/api/v1/marketing/marketing-campaigns/1/send/').status_code == 401
        assert anon.get('/api/v1/marketing/email-templates/').status_code == 401
        assert anon.get('/api/v1/marketing/marketing-campaigns/dashboard_stats/').status_code == 401
        # front-desk staff (role STAFF) can't send campaigns either
        assert staff_client.get('/api/v1/marketing/marketing-campaigns/').status_code == 403

    def test_payment_admin_tools_need_staff(self, staff_client):
        anon = APIClient()
        assert anon.post('/api/v1/payments/reverify/ORDER1/').status_code == 401
        assert anon.get('/api/v1/payments/booking/1/session/status/').status_code == 401
        assert staff_client.get('/api/v1/payments/booking/999/session/status/').status_code == 404

    def test_payment_sweep_runs_at_most_once_a_minute(self):
        first = APIClient().post('/api/v1/payments/auto-verify/').data
        second = APIClient().post('/api/v1/payments/auto-verify/').data
        assert first['success'] and not first.get('skipped')
        assert second['skipped'] is True

    def test_public_pages_still_work(self):
        anon = APIClient()
        assert anon.get('/api/v1/bookings/calendar/today/').status_code == 200
        assert anon.get('/api/v1/bookings/public/calendar/').status_code == 200
        assert anon.get('/api/v1/cms/faqs/').status_code == 200

    def test_health_check_is_read_only(self):
        assert APIClient().get('/api/health/').status_code == 200
        assert APIClient().post('/api/health/').status_code == 405


@pytest.mark.django_db
class TestLoginLimits:
    def test_admin_sign_in_is_rate_limited(self):
        client = APIClient()
        codes = [client.post('/api/token/', {'email': 'nobody@example.com', 'password': f'guess{i}'}, format='json')
                 .status_code for i in range(11)]
        assert codes[:10] == [401] * 10 and codes[10] == 429

    def test_customer_sign_in_is_rate_limited(self):
        client = APIClient()
        url = '/api/v1/bookings/customer-auth/login/'
        codes = [client.post(url, {'email': 'nobody@example.com', 'password': f'guess{i}'}, format='json').status_code
                 for i in range(11)]
        assert 429 not in codes[:10] and codes[10] == 429


@pytest.mark.django_db
def test_cookie_sign_in_needs_csrf_token_for_changes():
    from rest_framework_simplejwt.tokens import RefreshToken
    user = get_user_model().objects.create_user(username='csrf-admin', email='csrf-admin@example.com',
                                                password='x-Test-12345', role='ADMIN')
    client = APIClient(enforce_csrf_checks=True)
    client.cookies['admin_token'] = str(RefreshToken.for_user(user).access_token)
    assert client.get('/api/v1/shop/vouchers/').status_code == 200          # reading is fine
    response = client.post('/api/v1/shop/vouchers/', {'code': 'CSRF-1', 'discount_type': 'FLAT',
                                                      'discount_value': '5'}, format='json')
    assert response.status_code == 403 and not Voucher.objects.exists()
    # the website's server uses an Authorization header, which is not affected
    header = APIClient(enforce_csrf_checks=True)
    header.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(user).access_token}')
    assert header.post('/api/v1/shop/vouchers/', {'code': 'CSRF-2', 'discount_type': 'FLAT',
                                                   'discount_value': '5'}, format='json').status_code == 201


@pytest.mark.django_db
def test_used_voucher_cannot_be_deleted(admin_client, config, plans):
    voucher = Voucher.objects.create(code='KEEP', discount_type='FLAT', discount_value=Decimal('5'), is_active=True)
    unused = Voucher.objects.create(code='UNUSED', discount_type='FLAT', discount_value=Decimal('5'), is_active=True)
    assert APIClient().post(SESSIONS_URL, session_payload(plans, voucher_code='KEEP'), format='json').status_code == 201
    assert VoucherRedemption.objects.filter(voucher=voucher).exists()
    assert admin_client.delete(f'/api/v1/shop/vouchers/{voucher.id}/').status_code == 400
    assert admin_client.delete(f'/api/v1/shop/vouchers/{unused.id}/').status_code == 204
