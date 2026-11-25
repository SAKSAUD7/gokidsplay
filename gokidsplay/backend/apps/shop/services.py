"""
Vouchers: the rules (evaluate_voucher) shared by the public "apply code" check
and server-side booking pricing, so both always agree — plus recording each use
(redeem_voucher) and giving it back when a booking is cancelled (release_voucher).

Rules: active · start date · expiry · sessions / parties only · total uses ·
uses per customer (e-mail) · minimum spend · book N hours ahead · % or £ off
(optional cap on percentage discounts) · Buy X Get Y Free.

Buy X Get Y Free (play sessions): every ticket in the booking is one person. For each
full group of X + Y people, Y of them go free, and the free ones are always the
cheapest tickets. E.g. Buy 2 Get 1: 3 people → 1 free, 5 → 1 free, 6 → 2 free.
"""
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Sequence, Tuple

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
    # Buy X Get Y Free: which tickets are free, e.g. [{'label': 'Child', 'qty': 2, 'price_each': 12.95, 'total': 25.9}]
    free_items: List[dict] = field(default_factory=list)
    summary: str = ''           # e.g. "Buy 2 Get 1 Free: 6 tickets, 2 free"


# One entry per ticket (person): (ticket name, price)
TicketItems = Sequence[Tuple[str, Decimal]]


def offer_name(voucher: Voucher) -> str:
    """How the offer reads to staff and customers, e.g. '20% off', '£5.00 off', 'Buy 2 Get 1 Free'."""
    if voucher.discount_type == 'BUY_X_GET_Y':
        return f"Buy {voucher.buy_quantity} Get {voucher.free_quantity} Free"
    if voucher.discount_type == 'PERCENTAGE':
        return f"{Decimal(voucher.discount_value).normalize():f}% off"
    return f"£{Decimal(voucher.discount_value):.2f} off"


def free_tickets(voucher: Voucher, items: TicketItems):
    """
    Buy X Get Y Free: (free ticket count, [(name, price), ...] of the free tickets).
    The cheapest tickets are the free ones.
    """
    buy, free = int(voucher.buy_quantity or 0), int(voucher.free_quantity or 0)
    if buy < 1 or free < 1:
        return 0, []
    count = (len(items) // (buy + free)) * free
    cheapest = sorted(((str(name), Decimal(str(price))) for name, price in items), key=lambda item: item[1])
    return count, cheapest[:count]


def normalise_code(code: str) -> str:
    return (code or '').strip().upper()


def _uses_by(voucher: Voucher, email: str) -> int:
    return VoucherRedemption.objects.filter(voucher=voucher, email__iexact=email.strip(), released=False).count()


def evaluate_voucher(code: str, order_amount: Decimal, booking_datetime: Optional[str] = None,
                     kind: Optional[str] = None, email: Optional[str] = None,
                     items: Optional[TicketItems] = None) -> VoucherResult:
    """
    Check a voucher code. kind is 'session' or 'party'; email (when known)
    enforces the per-customer limit; items are the booking's tickets, one
    (name, price) per person (needed by Buy X Get Y Free offers).
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
    if voucher.discount_type == 'BUY_X_GET_Y' and kind != 'session':
        return VoucherResult(False, error='This offer is for play session tickets only')
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

    result = VoucherResult(True, voucher=voucher)
    if voucher.discount_type == 'BUY_X_GET_Y':
        group = int(voucher.buy_quantity or 0) + int(voucher.free_quantity or 0)
        if not items:
            return VoucherResult(False, error='Please choose your tickets first, then apply this code')
        count, free = free_tickets(voucher, items)
        if count == 0:
            return VoucherResult(False, error=f'{offer_name(voucher)} needs at least {group} tickets in the booking')
        discount = sum((price for _, price in free), Decimal('0'))
        if voucher.max_discount_amount:
            discount = min(discount, voucher.max_discount_amount)
        grouped = {}
        for name, price in free:
            line = grouped.setdefault((name, price), {'label': name, 'qty': 0, 'price_each': float(price), 'total': 0.0})
            line['qty'] += 1
            line['total'] = float(price * line['qty'])
        result.free_items = list(grouped.values())
        result.summary = f"{offer_name(voucher)}: {len(items)} tickets, {count} free"
    elif voucher.discount_type == 'PERCENTAGE':
        discount = (order_amount * voucher.discount_value) / Decimal('100')
        if voucher.max_discount_amount:
            discount = min(discount, voucher.max_discount_amount)
        result.summary = offer_name(voucher)
    else:  # FLAT
        discount = voucher.discount_value
        result.summary = offer_name(voucher)
    result.discount = min(discount, order_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return result


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
