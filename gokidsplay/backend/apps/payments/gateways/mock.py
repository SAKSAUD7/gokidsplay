"""
Mock payment gateway — for testing the booking and payment flow without SumUp.

Turn on with PAYMENT_MODE=mock in backend/.env (only works while DEBUG=True, so
it can never be used on the live site). It behaves like SumUp's hosted
checkout:

  1. create_order() saves a Payment (provider MOCK) and sends the customer to a
     test checkout page (GET /api/v1/payments/mock-checkout/<order_id>/)
  2. on that page the tester presses "Pay" or "Decline"; they are sent back to
     the website's /book/success page, like SumUp's redirect
  3. verify_payment() reports the result and, when paid, updates the booking
     with exactly the same code as SumUp (apply_successful_payment)
"""
import logging
import uuid
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple

from django.conf import settings

from ..models import Payment
from .base import BasePaymentGateway, apply_refund, apply_successful_payment

logger = logging.getLogger(__name__)


def backend_base_url() -> str:
    return (getattr(settings, 'BACKEND_URL', '') or 'http://localhost:9000').rstrip('/')


def frontend_return_url() -> str:
    explicit = getattr(settings, 'SUMUP_RETURN_URL', '')
    if explicit:
        return explicit
    return f"{(getattr(settings, 'FRONTEND_URL', '') or 'http://localhost:5000').rstrip('/')}/book/success"


class MockPaymentGateway(BasePaymentGateway):
    def get_provider_name(self) -> str:
        return 'MOCK'

    def create_order(self, booking, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        from apps.bookings.models import PartyBooking
        is_party = isinstance(booking, PartyBooking)
        amount = Decimal(str(amount if amount is not None else booking.remaining_balance))
        order_id = f"mock_{uuid.uuid4().hex[:16]}"
        reference = f"{booking.booking_number or booking.id}-{uuid.uuid4().hex[:6].upper()}"
        Payment.objects.create(
            **({'party_booking': booking} if is_party else {'booking': booking}),
            provider='MOCK', order_id=order_id, amount=amount, currency='GBP', status='CREATED',
            provider_response={'checkout_reference': reference, 'mock_status': 'PENDING',
                               'booking_type': 'party' if is_party else 'session'},
        )
        return {
            'order_id': order_id,
            'checkout_url': f"{backend_base_url()}/api/v1/payments/mock-checkout/{order_id}/",
            'provider': 'mock',
            'amount': float(amount),
            'currency': 'GBP',
            'reference': reference,
        }

    def verify_payment(self, data: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        order_id = data.get('order_id')
        try:
            payment = Payment.objects.get(order_id=order_id)
        except Payment.DoesNotExist:
            return False, '', {'error': 'Payment not found'}
        state = (payment.provider_response or {}).get('mock_status', 'PENDING')
        if state == 'PAID':
            tx_id = (payment.provider_response or {}).get('transaction_id') or f"mocktx_{order_id[5:]}"
            apply_successful_payment(payment, tx_id, {**(payment.provider_response or {}), 'status': 'PAID'})
            return True, tx_id, {'status': 'PAID'}
        if state == 'FAILED':
            if payment.status != 'FAILED':
                payment.mark_failed('Test payment declined')
            return False, '', {'error': 'Checkout failed', 'status': 'FAILED'}
        return False, '', {'error': 'Payment not completed yet', 'status': 'PENDING'}

    def refund(self, payment, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        refund_amount = Decimal(str(amount if amount is not None else payment.amount))
        apply_refund(payment, refund_amount)
        return {'refund_id': f"mockrefund_{uuid.uuid4().hex[:10]}", 'amount': float(refund_amount),
                'currency': 'GBP', 'status': 'REFUNDED'}
