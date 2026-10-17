"""
Opening hours and session rules, read from the CMS Session Booking Configuration.

The booking calendar on the website uses the same settings (plus the Coventry
school / bank holiday calendar) to decide which dates and times can be booked.
"""
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple

from apps.cms.models import SessionBookingConfig, default_holiday_hours, default_weekly_opening_hours

DEFAULT_SESSION_MINUTES = 120


def session_config() -> SessionBookingConfig:
    return SessionBookingConfig.get_config()


def _parse(value) -> Optional[Tuple[str, str]]:
    if isinstance(value, dict) and value.get('open') and value.get('close'):
        return value['open'], value['close']
    return None


def weekly_hours(check_date: date, config: Optional[SessionBookingConfig] = None) -> Optional[Tuple[str, str]]:
    """(open, close) as "HH:MM" for the normal weekly hours of this weekday, or None when closed."""
    config = config or session_config()
    hours = config.opening_hours or default_weekly_opening_hours()
    js_day = (check_date.weekday() + 1) % 7  # stored with 0 = Sunday, like the website calendar
    return _parse(hours.get(str(js_day)))


# Admin date overrides (BookingBlock) that close a date
CLOSING_BLOCK_TYPES = ('BLOCKED_DATE', 'CLOSED', 'CLOSED_TODAY', 'MAINTENANCE', 'PRIVATE_EVENT', 'OTHER')
OPENING_BLOCK_TYPE = 'OPEN_TODAY'


def _date_blocks(start: date, end: date):
    from .models import BookingBlock
    return list(BookingBlock.objects.filter(start_date__lte=end, end_date__gte=start, slot_time__isnull=True)
                .order_by('created_at'))


def day_status(check_date: date, config: Optional[SessionBookingConfig] = None, blocks=None) -> dict:
    """
    Whether Go Kids Play is open on a date, for play sessions and for parties.

    1. Weekly hours (Website Content → Session Booking), e.g. Saturday & Sunday 10.30am–6pm
    2. Coventry school holidays / bank holidays: open with the holiday hours
    3. Admin overrides (Calendar → Opening Days): a special opening opens the
       date; a closure closes sessions and/or parties. Closures win.
    """
    from .uk_calendar import is_bank_holiday, is_school_holiday
    config = config or session_config()
    blocks = _date_blocks(check_date, check_date) if blocks is None else [
        b for b in blocks if b.start_date <= check_date <= b.end_date and b.slot_time is None]

    hours = weekly_hours(check_date, config)
    holiday = is_bank_holiday(check_date) or is_school_holiday(check_date)
    holiday_hours = _parse(config.holiday_hours or default_holiday_hours())
    if holiday:
        hours = holiday_hours or hours
        source = 'bank_holiday' if is_bank_holiday(check_date) else 'school_holiday'
        reason = 'Bank holiday' if source == 'bank_holiday' else 'School holiday'
    else:
        source = 'weekly' if hours else 'closed_weekly'
        reason = '' if hours else 'Closed (open on school & bank holidays)'
    sessions_open = parties_open = hours is not None
    override = None

    opening = next((b for b in blocks if b.type == OPENING_BLOCK_TYPE), None)
    if opening:
        custom = (opening.open_time.strftime('%H:%M'), opening.close_time.strftime('%H:%M'))             if opening.open_time and opening.close_time else None
        hours = custom or hours or holiday_hours
        sessions_open = parties_open = hours is not None
        source, reason, override = 'special_opening', opening.reason or 'Special opening', opening

    for block in blocks:
        if block.type not in CLOSING_BLOCK_TYPES:
            continue
        if block.blocks_normal_bookings:
            sessions_open = False
        if block.blocks_party_bookings:
            parties_open = False
        if block.blocks_normal_bookings or block.blocks_party_bookings:
            source, reason, override = 'closure', block.reason or 'Closed', block

    return {
        'date': check_date.isoformat(),
        'sessions_open': sessions_open,
        'parties_open': parties_open,
        'open': hours[0] if hours else None,
        'close': hours[1] if hours else None,
        'source': source,
        'reason': reason,
        'override_id': override.id if override else None,
        'override_type': override.type if override else None,
    }


def calendar_days(start: date, end: date, config: Optional[SessionBookingConfig] = None) -> list:
    """day_status for every date from start to end (inclusive), with one database query."""
    config = config or session_config()
    blocks = _date_blocks(start, end)
    days, d = [], start
    while d <= end:
        days.append(day_status(d, config, blocks))
        d += timedelta(days=1)
    return days


def hours_for_booking_day(check_date: date, config: Optional[SessionBookingConfig] = None) -> Optional[Tuple[str, str]]:
    """(open, close) for play sessions on this date, or None when sessions can't be booked."""
    status = day_status(check_date, config)
    return (status['open'], status['close']) if status['sessions_open'] else None


def session_minutes(config: Optional[SessionBookingConfig] = None) -> int:
    config = config or session_config()
    return config.duration_minutes or DEFAULT_SESSION_MINUTES


def is_anytime(config: Optional[SessionBookingConfig] = None) -> bool:
    config = config or session_config()
    return config.session_mode == SessionBookingConfig.SESSION_MODE_ANYTIME


def session_start_times(check_date: date, config: Optional[SessionBookingConfig] = None) -> List[str]:
    """
    Bookable start times for a date: the opening time in Anytime mode, otherwise
    every arrival interval that still leaves a full session before closing.
    """
    config = config or session_config()
    hours = hours_for_booking_day(check_date, config)
    if not hours:
        return []
    open_t = datetime.strptime(hours[0], '%H:%M')
    close_t = datetime.strptime(hours[1], '%H:%M')
    if is_anytime(config):
        return [hours[0]]
    step = timedelta(minutes=max(5, config.arrival_interval_minutes or 30))
    length = timedelta(minutes=session_minutes(config))
    times, t = [], open_t
    while t + length <= close_t:
        times.append(t.strftime('%H:%M'))
        t += step
    return times


def is_session_still_bookable(check_date: date, start_time: str, now: Optional[datetime] = None,
                              config: Optional[SessionBookingConfig] = None) -> bool:
    """
    Whether a customer can still book this session online.
    Anytime sessions can be booked on the day until an hour before closing;
    arrival times only while they are still in the future.
    """
    from django.utils import timezone
    config = config or session_config()
    now = now or timezone.localtime()
    today = now.date()
    if check_date < today:
        return False
    if check_date > today:
        return True
    current = now.strftime('%H:%M')
    if is_anytime(config):
        hours = hours_for_booking_day(check_date, config)
        if not hours:
            return False
        last_booking = (datetime.strptime(hours[1], '%H:%M') - timedelta(minutes=60)).strftime('%H:%M')
        return current < last_booking
    return start_time > current
