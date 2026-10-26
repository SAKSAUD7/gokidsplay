"""
SumUp gateway with SumUp's API faked (no network): checkout payload, webhook safety.
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.bookings.models import Booking
from apps.payments.models import Payment

from .test_booking_security import SESSIONS_URL, config, plans, session_payload  # noqa: F401 (fixtures)


class FakeResponse:
    def __init__(self, data, status=200):
        self._data, self.status_code, self.content = data, status, b'x'

    def json(self):
        return self._data

    def raise_for_status(self):
        if self.status_code >= 400:
            import requests
            raise requests.HTTPError(f'{self.status_code}')


@pytest.fixture
def sumup(settings, monkeypatch):
    """The real SumUp gateway, with SumUp's API replaced by a fake that records calls."""
    from apps.payments.gateways import sumup as sumup_module
    from apps.payments.gateways.sumup import SumUpGateway
    from apps.payments.services import payment_service
    settings.PAYMENT_MODE = 'sumup'
    settings.SUMUP_API_KEY = 'sup_sk_test'
    settings.SUMUP_MERCHANT_CODE = 'MTEST123'
    settings.FRONTEND_URL = 'https://www.gokidsplay.co.uk'
    settings.BACKEND_URL = 'https://api.gokidsplay.co.uk'
    fake = {'posts': [], 'status': 'PENDING'}

    def post(url, json=None, headers=None, timeout=None):
        fake['posts'].append((url, json))
        return FakeResponse({'id': 'chk_123', 'hosted_checkout_url': 'https://checkout.sumup.com/pay/chk_123'})

    def get(url, headers=None, timeout=None):
        tx = [{'id': 'tx_1'}] if fake['status'] == 'PAID' else []
        return FakeResponse({'id': 'chk_123', 'status': fake['status'], 'transactions': tx})

    monkeypatch.setattr(sumup_module.requests, 'post', post)
    monkeypatch.setattr(sumup_module.requests, 'get', get)
    monkeypatch.setattr(payment_service, 'gateway', SumUpGateway())
    return fake


def create_order(plans):
    booking_id = APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data['id']
    response = APIClient().post('/api/v1/payments/create-order/', {'booking_id': booking_id, 'booking_type': 'session'},
                                format='json')
    assert response.status_code == 200, response.data
    return Booking.objects.get(pk=booking_id), response.data


@pytest.mark.django_db
class TestSumUp:
    def test_checkout_payload(self, config, plans, sumup):
        booking, order = create_order(plans)
        url, payload = sumup['posts'][0]
        assert url.endswith('/v0.1/checkouts')
        assert payload['merchant_code'] == 'MTEST123' and payload['currency'] == 'GBP'
        assert Decimal(str(payload['amount'])) == booking.amount               # server-side price
        assert payload['checkout_reference'].startswith(booking.booking_number)
        assert payload['return_url'] == 'https://api.gokidsplay.co.uk/api/v1/payments/sumup-webhook/'
        # top-level redirect_url (SumUp ignores it inside hosted_checkout); carries the private e-ticket id
        assert payload['redirect_url'].startswith('https://www.gokidsplay.co.uk/book/success?booking_id=' + str(booking.uuid))
        assert payload['hosted_checkout'] == {'enabled': True}
        assert order['checkout_url'] == 'https://checkout.sumup.com/pay/chk_123'

    def test_no_webhook_address_on_a_pc(self, config, plans, sumup, settings):
        settings.BACKEND_URL = 'http://localhost:9000'
        create_order(plans)
        assert 'return_url' not in sumup['posts'][0][1]

    def test_fake_webhook_cannot_fail_or_pay_a_booking(self, config, plans, sumup):
        booking, _ = create_order(plans)
        # someone posts a made-up "FAILED" / "PAID": SumUp's API still says PENDING
        for claimed in ('FAILED', 'PAID'):
            assert APIClient().post('/api/v1/payments/sumup-webhook/', {'id': 'chk_123', 'status': claimed},
                                    format='json').status_code == 200
        assert Payment.objects.get(order_id='chk_123').status == 'CREATED'
        booking.refresh_from_db()
        assert booking.payment_status == 'PENDING'
        # unknown checkouts are ignored
        assert APIClient().post('/api/v1/payments/sumup-webhook/', {'id': 'not-ours'}, format='json').status_code == 200

    def test_coming_back_with_our_reference_finds_the_payment(self, config, plans, sumup):
        booking, _ = create_order(plans)
        reference = sumup['posts'][0][1]['checkout_reference']
        sumup['status'] = 'PAID'
        data = APIClient().post('/api/v1/payments/verify/', {'order_id': reference}, format='json').data
        assert data['payment_status'] == 'PAID'
        assert data['booking_uuid'] == str(booking.uuid) and data['booking_number'] == booking.booking_number

    def test_real_webhook_marks_paid(self, config, plans, sumup):
        booking, _ = create_order(plans)
        sumup['status'] = 'PAID'
        APIClient().post('/api/v1/payments/sumup-webhook/', {'event_type': 'CHECKOUT_STATUS_CHANGED', 'id': 'chk_123'},
                         format='json')
        payment = Payment.objects.get(order_id='chk_123')
        booking.refresh_from_db()
        assert payment.status == 'SUCCESS' and payment.payment_id == 'tx_1'
        assert booking.payment_status == 'PAID' and booking.paid_amount == booking.amount
