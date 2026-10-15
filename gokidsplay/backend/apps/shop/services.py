"""
Voucher evaluation shared by the public validate endpoint and server-side
booking pricing, so both always agree on whether a code applies and how much
it takes off.
"""
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from django.utils import timezone

from .models import Voucher


@dataclass
class VoucherResult:
    valid: bool
    voucher: Optional[Voucher] = None
    discount: Decimal = Decimal('0.00')
    error: str = ''


def evaluate_voucher(code: str, order_amount: Decimal, booking_datetime: Optional[str] = None) -> VoucherResult:
    """Check a voucher code against an order amount (and optional booking slot)."""
    code = (code or '').strip().upper()
    if not code:
        return VoucherResult(False, error='Voucher code is required')

    try:
        voucher = Voucher.objects.get(code__iexact=code)
    except Voucher.DoesNotExist:
        return VoucherResult(False, error='Invalid voucher code')

    if not voucher.is_active:
        return VoucherResult(False, error='This voucher is no longer active')

    if voucher.expiry_date and voucher.expiry_date < timezone.now():
        return VoucherResult(False, error='This voucher has expired')

    if voucher.usage_limit and voucher.used_count >= voucher.usage_limit:
        return VoucherResult(False, error='This voucher has reached its usage limit')

    if voucher.min_order_amount and order_amount < voucher.min_order_amount:
        return VoucherResult(False, error=f'Minimum order amount of £{voucher.min_order_amount:.2f} required')

    if voucher.min_hours_before_slot > 0:
        if not booking_datetime:
            return VoucherResult(False, error='Please select a booking time to apply this voucher')
        try:
            slot = datetime.fromisoformat(str(booking_datetime).replace('Z', '+00:00'))
            if timezone.is_naive(slot):
                slot = timezone.make_aware(slot)
        except (ValueError, TypeError):
            return VoucherResult(False, error='Invalid booking time format')
        hours_until = (slot - timezone.now()).total_seconds() / 3600
        if hours_until < voucher.min_hours_before_slot:
            return VoucherResult(
                False,
                error=f'This voucher requires booking at least {voucher.min_hours_before_slot} hours in advance. '
                      'Please select a later time slot.',
            )

    if voucher.discount_type == 'PERCENTAGE':
        discount = (order_amount * voucher.discount_value) / Decimal('100')
    else:  # FLAT
        discount = voucher.discount_value
    discount = min(discount, order_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    return VoucherResult(True, voucher=voucher, discount=discount)
