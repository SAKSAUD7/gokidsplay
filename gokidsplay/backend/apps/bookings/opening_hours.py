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


def hours_for_booking_day(check_date: date, config: Optional[SessionBookingConfig] = None) -> Optional[Tuple[str, str]]:
    """
    Hours used for a date a customer was allowed to book. A normally closed day is
    only bookable on a school / bank holiday (the website checks the council calendar),
    so it uses the holiday hours.
    """
    config = config or session_config()
    return weekly_hours(check_date, config) or _parse(config.holiday_hours or default_holiday_hours())


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
