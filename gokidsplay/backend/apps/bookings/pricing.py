"""
Server-side price calculation for public session bookings.

The booking API is public (the website's booking wizard creates bookings
anonymously), so the backend must never trust an amount sent by the client.
For every non-staff booking the price is recalculated here from the CMS
session-booking config — the same formula the booking wizard shows the customer.
"""
from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional

TWO_PLACES = Decimal('0.01')

# Flat fee added to online customer bookings (staff/admin bookings are exempt)
ONLINE_BOOKING_FEE = Decimal('2.00')

ADD_ON_META = {
    'parking': {'label': 'Parking', 'emoji': '\U0001F697', 'config_field': 'parking_price', 'default': Decimal('3.00')},
}


def _money(value) -> Decimal:
    return Decimal(str(value)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


@dataclass
class SessionPrice:
    subtotal: Decimal
    vat: Decimal
    booking_fee: Decimal
    discount: Decimal
    amount: Decimal
    add_ons: List[Dict[str, Any]] = field(default_factory=list)
    voucher: Any = None
    voucher_code: Optional[str] = None
    error: str = ''


def _requested_add_on_quantities(raw_add_ons) -> Dict[str, int]:
    """Accept either [{id, qty, ...}] (what the website sends) or {id: qty}; prices are ignored."""
    quantities: Dict[str, int] = {}
    if isinstance(raw_add_ons, dict):
        items = raw_add_ons.items()
    elif isinstance(raw_add_ons, list):
        items = [((item or {}).get('id'), (item or {}).get('qty')) for item in raw_add_ons if isinstance(item, dict)]
    else:
        items = []
    for add_on_id, qty in items:
        try:
            qty = int(qty or 0)
        except (TypeError, ValueError):
            continue
        if add_on_id in ADD_ON_META and qty > 0:
            quantities[add_on_id] = min(qty, 20)
    return quantities


def price_session_booking(
    *,
    adults: int,
    kids: int,
    spectators: int,
    add_ons=None,
    voucher_code: Optional[str] = None,
    booking_datetime: Optional[str] = None,
    include_online_fee: bool = True,
) -> SessionPrice:
    from apps.cms.models import SessionBookingConfig
    from apps.shop.services import evaluate_voucher

    config = SessionBookingConfig.get_config()
    adult_price = _money(config.adult_price)
    kid_price = _money(config.kid_price)
    spectator_price = _money(config.spectator_price)
    vat_rate = Decimal(str(config.gst_rate or 0))

    subtotal = adults * adult_price + kids * kid_price + spectators * spectator_price

    add_on_lines: List[Dict[str, Any]] = []
    for add_on_id, qty in _requested_add_on_quantities(add_ons).items():
        meta = ADD_ON_META[add_on_id]
        price_each = _money(getattr(config, meta['config_field'], None) or meta['default'])
        line_total = _money(price_each * qty)
        subtotal += line_total
        add_on_lines.append({
            'id': add_on_id,
            'label': meta['label'],
            'emoji': meta['emoji'],
            'qty': qty,
            'price_each': float(price_each),
            'subtotal': float(line_total),
        })

    subtotal = _money(subtotal)
    vat = _money(subtotal * vat_rate / Decimal('100'))
    booking_fee = ONLINE_BOOKING_FEE if include_online_fee else Decimal('0.00')
    total = _money(subtotal + vat + booking_fee)

    price = SessionPrice(subtotal=subtotal, vat=vat, booking_fee=booking_fee,
                         discount=Decimal('0.00'), amount=total, add_ons=add_on_lines)

    if voucher_code and str(voucher_code).strip():
        result = evaluate_voucher(voucher_code, subtotal, booking_datetime)
        if not result.valid:
            price.error = result.error
            return price
        price.discount = min(result.discount, total)
        price.amount = _money(total - price.discount)
        price.voucher = result.voucher
        price.voucher_code = result.voucher.code

    return price


# ── All-access admission tickets ─────────────────────────────────────────────
# Go Kids Play sells one 2-hour admission covering every activity, priced by age.
# The ticket types are the active "Session" Pricing Plans in the CMS (the same
# plans shown on the Prices page).

@dataclass
class AdmissionPrice:
    tickets: List[Dict[str, Any]]
    players: int        # playing tickets (count towards play capacity)
    spectators: int     # non-playing tickets
    subtotal: Decimal
    vat: Decimal
    booking_fee: Decimal
    discount: Decimal
    amount: Decimal
    add_ons: List[Dict[str, Any]] = field(default_factory=list)
    voucher: Any = None
    voucher_code: Optional[str] = None
    error: str = ''


def _requested_ticket_quantities(raw_tickets) -> Dict[int, int]:
    """Accept {plan_id: qty} or [{plan_id|id, qty}]; client prices are ignored."""
    quantities: Dict[int, int] = {}
    if isinstance(raw_tickets, dict):
        items = raw_tickets.items()
    elif isinstance(raw_tickets, list):
        items = [((t or {}).get('plan_id', (t or {}).get('id')), (t or {}).get('qty')) for t in raw_tickets if isinstance(t, dict)]
    else:
        items = []
    for plan_id, qty in items:
        try:
            plan_id, qty = int(plan_id), int(qty or 0)
        except (TypeError, ValueError):
            continue
        if qty > 0:
            quantities[plan_id] = min(qty, 50)
    return quantities


def price_admission(
    *,
    tickets,
    add_ons=None,
    voucher_code: Optional[str] = None,
    booking_datetime: Optional[str] = None,
    include_online_fee: bool = True,
) -> AdmissionPrice:
    from apps.cms.models import PricingPlan, SessionBookingConfig
    from apps.shop.services import evaluate_voucher

    config = SessionBookingConfig.get_config()
    vat_rate = Decimal(str(config.gst_rate or 0))
    quantities = _requested_ticket_quantities(tickets)
    plans = {p.id: p for p in PricingPlan.objects.filter(id__in=quantities.keys(), type='SESSION', active=True)}

    lines: List[Dict[str, Any]] = []
    players = spectators = 0
    subtotal = Decimal('0')
    for plan_id, qty in quantities.items():
        plan = plans.get(plan_id)
        if plan is None:
            continue  # unknown / inactive ticket type
        price_each = _money(plan.price)
        line_total = _money(price_each * qty)
        subtotal += line_total
        if plan.is_spectator:
            spectators += qty
        else:
            players += qty
        lines.append({
            'plan_id': plan.id,
            'label': plan.name,
            'qty': qty,
            'price_each': float(price_each),
            'subtotal': float(line_total),
            'playing': not plan.is_spectator,
        })

    price = AdmissionPrice(tickets=lines, players=players, spectators=spectators, subtotal=Decimal('0'),
                           vat=Decimal('0'), booking_fee=Decimal('0'), discount=Decimal('0'), amount=Decimal('0'))
    if players == 0:
        price.error = 'Please choose at least one playing ticket.'
        return price

    for add_on_id, qty in _requested_add_on_quantities(add_ons).items():
        meta = ADD_ON_META[add_on_id]
        price_each = _money(getattr(config, meta['config_field'], None) or meta['default'])
        line_total = _money(price_each * qty)
        subtotal += line_total
        price.add_ons.append({'id': add_on_id, 'label': meta['label'], 'emoji': meta['emoji'], 'qty': qty,
                              'price_each': float(price_each), 'subtotal': float(line_total)})

    price.subtotal = _money(subtotal)
    price.vat = _money(price.subtotal * vat_rate / Decimal('100'))
    price.booking_fee = ONLINE_BOOKING_FEE if include_online_fee else Decimal('0.00')
    total = _money(price.subtotal + price.vat + price.booking_fee)
    price.amount = total

    if voucher_code and str(voucher_code).strip():
        result = evaluate_voucher(voucher_code, price.subtotal, booking_datetime)
        if not result.valid:
            price.error = result.error
            return price
        price.discount = min(result.discount, total)
        price.amount = _money(total - price.discount)
        price.voucher = result.voucher
        price.voucher_code = result.voucher.code
    return price


# ── Party bookings ───────────────────────────────────────────────────────────
# Prices come from the CMS Party Booking Configuration; these are the fallbacks.
PARTY_BASE_PRICE = Decimal('250.00')       # includes INCLUDED_KIDS kids and INCLUDED_ADULTS adults
PARTY_INCLUDED_KIDS = 10
PARTY_INCLUDED_ADULTS = 10
PARTY_EXTRA_KID_PRICE = Decimal('20.00')
PARTY_EXTRA_ADULT_PRICE = Decimal('4.95')
PARTY_DEPOSIT_RATE = Decimal('0.50')


@dataclass
class PartyPrice:
    subtotal: Decimal
    discount: Decimal
    amount: Decimal
    deposit: Decimal
    package_price: Decimal = PARTY_BASE_PRICE
    voucher: Any = None
    voucher_code: Optional[str] = None


def party_rates() -> dict:
    """Party prices from the CMS Party Booking Configuration (with safe fallbacks)."""
    from apps.cms.models import PartyBookingConfig
    config = PartyBookingConfig.objects.filter(active=True).order_by('id').first()
    if config is None:
        return {'base': PARTY_BASE_PRICE, 'included_kids': PARTY_INCLUDED_KIDS,
                'included_adults': PARTY_INCLUDED_ADULTS, 'extra_kid': PARTY_EXTRA_KID_PRICE,
                'extra_adult': PARTY_EXTRA_ADULT_PRICE, 'deposit_rate': PARTY_DEPOSIT_RATE}
    return {
        'base': _money(config.package_price),
        'included_kids': max(0, int(config.min_participants or 0)),
        'included_adults': max(0, int(config.free_spectators or 0)),
        'extra_kid': _money(config.participant_price),
        'extra_adult': _money(config.spectator_price),
        'deposit_rate': Decimal(str(config.deposit_percentage or 0)) / Decimal('100'),
    }


def price_party_booking(*, kids: int, adults: int, voucher_code: Optional[str] = None) -> PartyPrice:
    from apps.shop.services import evaluate_voucher

    rates = party_rates()
    extra_kids = max(0, kids - rates['included_kids'])
    extra_adults = max(0, adults - rates['included_adults'])
    subtotal = _money(rates['base'] + extra_kids * rates['extra_kid'] + extra_adults * rates['extra_adult'])
    deposit_rate = rates['deposit_rate']

    price = PartyPrice(subtotal=subtotal, discount=Decimal('0.00'), amount=subtotal,
                       deposit=_money(subtotal * deposit_rate), package_price=rates['base'])

    # Same behaviour as the wizard: an invalid voucher is simply ignored for parties
    if voucher_code and str(voucher_code).strip():
        result = evaluate_voucher(voucher_code, subtotal)
        if result.valid:
            price.discount = result.discount
            price.amount = _money(subtotal - result.discount)
            price.deposit = _money(price.amount * deposit_rate)
            price.voucher = result.voucher
            price.voucher_code = result.voucher.code
    return price
