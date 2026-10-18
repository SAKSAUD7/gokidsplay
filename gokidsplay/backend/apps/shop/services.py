"""
Vouchers: the rules (evaluate_voucher) shared by the public "apply code" check
and server-side booking pricing, so both always agree — plus recording each use
(redeem_voucher) and giving it back when a booking is cancelled (release_voucher).

Rules: active · start date · expiry · sessions / parties only · total uses ·
uses per customer (e-mail) · minimum spend · book N hours ahead · % or £ off,
with an optional cap on percentage discounts.
"""
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from .models import Voucher, VoucherRedemption


@dataclass
class VoucherResult:
    valid: bool
    voucher: Optional[Voucher] = None
    discount: Decimal = Decimal('0.00')
    error: str = ''


def normalise_code(code: str) -> str:
    return (code or '').strip().upper()


def _uses_by(voucher: Voucher, email: str) -> int:
    return VoucherRedemption.objects.filter(voucher=voucher, email__iexact=email.strip(), released=False).count()


def evaluate_voucher(code: str, order_amount: Decimal, booking_datetime: Optional[str] = None,
                     kind: Optional[str] = None, email: Optional[str] = None) -> VoucherResult:
    """
    Check a voucher code. kind is 'session' or 'party'; email (when known)
    enforces the per-customer limit.
    """
    code = normalise_code(code)
    if not code:
        return VoucherResult(False, error='Voucher code is required')

    try:
        voucher = Voucher.objects.get(code__iexact=code)
    except Voucher.DoesNotExist:
        return VoucherResult(False, error='Invalid voucher code')

    now = timezone.now()
    if not voucher.is_active:
        return VoucherResult(False, error='This voucher is no longer active')
    if voucher.valid_from and voucher.valid_from > now:
        return VoucherResult(False, error=f"This voucher can be used from {timezone.localtime(voucher.valid_from):%d %b %Y}")
    if voucher.expiry_date and voucher.expiry_date < now:
        return VoucherResult(False, error='This voucher has expired')
    if kind and voucher.applies_to not in ('ALL', kind.upper()):
        what = 'play sessions' if voucher.applies_to == 'SESSION' else 'parties'
        return VoucherResult(False, error=f'This voucher is for {what} only')
    if voucher.usage_limit and voucher.used_count >= voucher.usage_limit:
        return VoucherResult(False, error='This voucher has reached its usage limit')
    if voucher.max_uses_per_customer and email and _uses_by(voucher, email) >= voucher.max_uses_per_customer:
        return VoucherResult(False, error='You have already used this voucher')
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
        hours_until = (slot - now).total_seconds() / 3600
        if hours_until < voucher.min_hours_before_slot:
            return VoucherResult(
                False,
                error=f'This voucher requires booking at least {voucher.min_hours_before_slot} hours in advance. '
                      'Please select a later time slot.',
            )

    if voucher.discount_type == 'PERCENTAGE':
        discount = (order_amount * voucher.discount_value) / Decimal('100')
        if voucher.max_discount_amount:
            discount = min(discount, voucher.max_discount_amount)
    else:  # FLAT
        discount = voucher.discount_value
    discount = min(discount, order_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    return VoucherResult(True, voucher=voucher, discount=discount)


class VoucherUnavailable(Exception):
    """The last use was taken by someone else while this booking was being made."""


def redeem_voucher(voucher: Voucher, *, booking=None, party_booking=None, email: str = '',
                   discount: Decimal = Decimal('0')) -> VoucherRedemption:
    """
    Record one use. Call inside the booking's transaction: the voucher row is
    locked and the limits re-checked, so two people can't both take the last use.
    """
    with transaction.atomic():
        locked = Voucher.objects.select_for_update().get(pk=voucher.pk)
        if locked.usage_limit and locked.used_count >= locked.usage_limit:
            raise VoucherUnavailable('This voucher has just reached its usage limit')
        if locked.max_uses_per_customer and email and _uses_by(locked, email) >= locked.max_uses_per_customer:
            raise VoucherUnavailable('You have already used this voucher')
        Voucher.objects.filter(pk=locked.pk).update(used_count=F('used_count') + 1)
        return VoucherRedemption.objects.create(voucher=locked, booking=booking, party_booking=party_booking,
                                                email=(email or '').strip().lower(), discount_amount=discount)


def release_voucher(*, booking=None, party_booking=None) -> int:
    """The booking was cancelled: give its voucher use back. Returns how many uses were released."""
    redemptions = VoucherRedemption.objects.filter(released=False, booking=booking, party_booking=party_booking) \
        if (booking or party_booking) else VoucherRedemption.objects.none()
    released = 0
    for redemption in redemptions.select_related('voucher'):
        with transaction.atomic():
            redemption.released = True
            redemption.save(update_fields=['released', 'updated_at'])
            Voucher.objects.filter(pk=redemption.voucher_id, used_count__gt=0).update(used_count=F('used_count') - 1)
            released += 1
    return released


def restore_voucher(*, booking=None, party_booking=None) -> int:
    """A cancelled booking was confirmed again (e.g. paid late): count its voucher use again."""
    redemptions = VoucherRedemption.objects.filter(released=True, booking=booking, party_booking=party_booking) \
        if (booking or party_booking) else VoucherRedemption.objects.none()
    restored = 0
    for redemption in redemptions:
        redemption.released = False
        redemption.save(update_fields=['released', 'updated_at'])
        Voucher.objects.filter(pk=redemption.voucher_id).update(used_count=F('used_count') + 1)
        restored += 1
    return restored
