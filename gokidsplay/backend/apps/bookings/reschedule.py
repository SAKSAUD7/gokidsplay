"""
Moving a booking to another date / time: customers in My Account ("Change date") and
staff in the admin portal (party "Reschedule").

Rules for customers
- Play sessions and parties. Event reservations belong to the event's date, so they can't move.
- Up to CUTOFF_HOURS (10) before the booking starts; after that the team can still help.
- At most MAX_CUSTOMER_CHANGES moves per booking.
- Same guests, same price. A party moved within PARTY_FEE_DAYS (14) of its date gets the
  PARTY_FEE (£50) change fee added to its balance (the same rule staff use); the customer
  sees it before confirming.
- An online booking that is still waiting for its payment can't move (pay first).
- The new date and time must be bookable exactly as a new booking would be: open, one of
  that day's session / party times, still to come, and with room for everyone.

Every move is written to the booking's history (Admin → booking → History), raises a
notification in the admin portal and e-mails the customer and the team.
"""
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import List, Optional, Union

from django.db import transaction
from django.utils import timezone

from .models import Booking, BookingAuditLog, PartyBooking

CUTOFF_HOURS = 10
MAX_CUSTOMER_CHANGES = 2
PARTY_FEE_DAYS = 14
PARTY_FEE = Decimal('50.00')
DAYS_AHEAD = 120            # how far ahead customers can move a booking

ENDED_STATUSES = ('CANCELLED', 'COMPLETED', 'EXPIRED', 'REFUNDED', 'NO_SHOW')

AnyBooking = Union[Booking, PartyBooking]


class RescheduleError(Exception):
    def __init__(self, message, code='NOT_ALLOWED', status=400):
        super().__init__(message)
        self.message, self.code, self.status = message, code, status


def kind_of(booking: AnyBooking) -> str:
    return 'party' if isinstance(booking, PartyBooking) else 'session'


def _status(booking: AnyBooking) -> str:
    return booking.status if isinstance(booking, PartyBooking) else booking.booking_status


def _hhmm(value) -> str:
    return value.strftime('%H:%M') if isinstance(value, time) else str(value or '')[:5]


def starts_at(booking: AnyBooking) -> datetime:
    """When the booking starts, in UK time."""
    start = booking.time if isinstance(booking.time, time) else time(0, 0)
    return timezone.make_aware(datetime.combine(booking.date, start), timezone.get_current_timezone())


def party_fee(booking: AnyBooking, today: Optional[date] = None) -> Decimal:
    """The change fee for moving this party now (none for sessions)."""
    if not isinstance(booking, PartyBooking):
        return Decimal('0')
    today = today or timezone.localdate()
    return PARTY_FEE if (booking.date - today).days <= PARTY_FEE_DAYS else Decimal('0')


@dataclass
class Eligibility:
    allowed: bool
    reason: str = ''
    deadline: Optional[datetime] = None
    fee: Decimal = Decimal('0')
    changes_left: int = 0

    def as_dict(self):
        return {'allowed': self.allowed, 'reason': self.reason,
                'deadline': self.deadline.isoformat() if self.deadline else None,
                'fee': float(self.fee), 'changes_left': self.changes_left,
                'cutoff_hours': CUTOFF_HOURS}


def eligibility(booking: AnyBooking, now: Optional[datetime] = None) -> Eligibility:
    """Can the customer move this booking themselves right now? (reason says why not)"""
    now = now or timezone.now()
    deadline = starts_at(booking) - timedelta(hours=CUTOFF_HOURS)
    changes_left = max(0, MAX_CUSTOMER_CHANGES - (booking.reschedule_count or 0))
    base = dict(deadline=deadline, changes_left=changes_left)
    if _status(booking) in ENDED_STATUSES:
        return Eligibility(False, 'This booking can no longer be changed.', **base)
    if starts_at(booking) <= now:
        return Eligibility(False, 'This booking has already started.', **base)
    if booking.online_checkout and not (booking.paid_amount or 0) and booking.payment_status in ('PENDING', 'FAILED'):
        return Eligibility(False, 'Please complete the payment first; then you can change the date.', **base)
    if now > deadline:
        return Eligibility(False, f'Date changes close {CUTOFF_HOURS} hours before your booking. '
                                  'Please contact us and we\'ll do our best to help.', **base)
    if changes_left <= 0:
        return Eligibility(False, 'This booking has already been moved the maximum number of times online. '
                                  'Please contact us to change it again.', **base)
    return Eligibility(True, deadline=deadline, fee=party_fee(booking), changes_left=changes_left)


# ── Where it can go ──────────────────────────────────────────────────────────

def _headcount(booking: AnyBooking) -> int:
    return (booking.adults or 0) + (booking.kids or 0)


def open_dates(booking: AnyBooking, start: Optional[date] = None, days: int = DAYS_AHEAD) -> List[str]:
    """Dates (YYYY-MM-DD) open for this kind of booking in the coming months."""
    from .opening_hours import calendar_days
    start = start or timezone.localdate()
    key = 'parties_open' if isinstance(booking, PartyBooking) else 'sessions_open'
    return [d['date'] for d in calendar_days(start, start + timedelta(days=days)) if d[key]]


def times_for(booking: AnyBooking, new_date: date, now: Optional[datetime] = None) -> List[dict]:
    """Start times on new_date, each with whether this booking fits there."""
    from .availability_service import GKPAvailabilityService
    from .opening_hours import day_status, party_start_times, session_start_times
    now = now or timezone.now()
    is_party = isinstance(booking, PartyBooking)
    starts = party_start_times(new_date, day=day_status(new_date)) if is_party else session_start_times(new_date)
    service = GKPAvailabilityService()
    needed = _headcount(booking)
    current = (booking.date, _hhmm(booking.time))
    options = []
    for start in starts:
        begins = timezone.make_aware(datetime.combine(new_date, datetime.strptime(start, '%H:%M').time()),
                                     timezone.get_current_timezone())
        if begins <= now:
            continue
        if (new_date, start) == current:
            options.append({'time': start, 'available': False, 'current': True, 'spots_free': None})
            continue
        # (a different time from the booking's own, so its own places aren't counted there;
        # in Anytime mode a day has one start time, so a new time is always a new day)
        if is_party:
            check = service.check_party_capacity(new_date, start, needed)
        else:
            check = service.check_session_capacity(new_date, start, needed)
        options.append({'time': start, 'available': bool(check['allowed']), 'current': False,
                        'spots_free': check.get('spots_free')})
    return options


# ── Moving it ────────────────────────────────────────────────────────────────

def _parse_new(new_date, new_time):
    try:
        day = new_date if isinstance(new_date, date) else date.fromisoformat(str(new_date)[:10])
    except ValueError:
        raise RescheduleError('Please choose a date.', 'INVALID_DATE')
    start = _hhmm(new_time)
    try:
        datetime.strptime(start, '%H:%M')
    except ValueError:
        raise RescheduleError('Please choose a time.', 'INVALID_TIME')
    return day, start


def move(booking: AnyBooking, new_date, new_time, *, changed_by: str, by_customer: bool,
         fee: Optional[Decimal] = None) -> dict:
    """
    Move the booking. Customers: every rule above is checked here (the website's choices are
    never trusted). Staff: any date and time; the party fee rule still applies unless `fee` is given.
    Returns {'old_date', 'old_time', 'fee'}.
    """
    new_day, new_start = _parse_new(new_date, new_time)
    model = type(booking)
    with transaction.atomic():
        booking = model.objects.select_for_update().get(pk=booking.pk)
        old_day, old_start = booking.date, _hhmm(booking.time)
        if (new_day, new_start) == (old_day, old_start):
            raise RescheduleError('That is already the date and time of this booking.', 'NO_CHANGE')

        if by_customer:
            check = eligibility(booking)
            if not check.allowed:
                raise RescheduleError(check.reason)
            option = next((o for o in times_for(booking, new_day) if o['time'] == new_start), None)
            if option is None:
                raise RescheduleError('Please choose one of the available times for that date.', 'INVALID_TIME')
            if not option['available']:
                raise RescheduleError('Sorry, that time is now full. Please choose another time.', 'FULL', 409)
            charge = check.fee
        else:
            charge = party_fee(booking) if fee is None else Decimal(str(fee))

        if not booking.original_date:
            booking.original_date = old_day
        booking.date = new_day
        booking.time = datetime.strptime(new_start, '%H:%M').time()
        booking.reschedule_count = (booking.reschedule_count or 0) + 1
        fields = ['date', 'time', 'original_date', 'reschedule_count']
        if charge > 0 and isinstance(booking, PartyBooking):
            booking.admin_fee_charged = (booking.admin_fee_charged or Decimal('0')) + charge
            booking.amount = (booking.amount or Decimal('0')) + charge
            fields += ['admin_fee_charged', 'amount']
            if booking.payment_status == 'PAID':
                booking.payment_status = 'PARTIAL'      # the fee is still to pay
                fields.append('payment_status')
        if isinstance(booking, PartyBooking) and not by_customer:
            booking.status = 'RESCHEDULED'
            fields.append('status')
        booking.save(update_fields=fields + (['updated_at'] if hasattr(booking, 'updated_at') else []))

        booking_type = 'PARTY' if isinstance(booking, PartyBooking) else 'SESSION'
        logs = [('date', old_day.isoformat(), new_day.isoformat())]
        if old_start != new_start:
            logs.append(('time', old_start, new_start))
        if charge > 0 and isinstance(booking, PartyBooking):
            logs.append(('change fee', '', f'£{charge:.2f} added to the balance'))
        BookingAuditLog.objects.bulk_create([
            BookingAuditLog(booking_id=booking.id, booking_type=booking_type, field_changed=field,
                            old_value=old, new_value=new, changed_by=changed_by)
            for field, old, new in logs])

        def tell_everyone():
            from apps.emails.notifications import booking_rescheduled
            booking_rescheduled(booking, old_date=old_day, old_time=old_start, fee=charge, by_customer=by_customer)
            if by_customer:
                from apps.core.models import Notification
                Notification.objects.create(
                    type='SYSTEM', title='Booking moved by customer',
                    message=f"{booking.name} moved {booking.booking_number or booking.id} from "
                            f"{old_day:%a %d %b} {old_start} to {new_day:%a %d %b} {new_start}"
                            + (f" (£{charge:.2f} change fee added)" if charge > 0 else ''),
                    link=f"/admin/{'party-bookings' if booking_type == 'PARTY' else 'bookings'}/{booking.id}")
        transaction.on_commit(tell_everyone)

    return {'old_date': old_day, 'old_time': old_start, 'fee': charge, 'booking': booking}
