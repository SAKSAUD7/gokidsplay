"""
Go Kids Play — Central Availability Service
============================================
This is the SINGLE source of truth for all availability decisions.

Precedence chain:
  External GKP Calendar (future)
    ↓ overridden by
  Admin Date Override (BookingBlock: BLOCKED_DATE, CLOSED, OPEN)
    ↓ filtered by
  Opening Hours Config
    ↓ filtered by
  Session Capacity (total headcount per time slot)
    ↓ filtered by
  Party Slot Configuration (which slots exist, capacity)
    ↓ filtered by
  Activity Availability (per-activity flags)
    ↓ filtered by
  Existing Confirmed Bookings
    ↓
  FINAL AVAILABILITY

The backend is the authoritative source.
The frontend must NEVER decide whether something is bookable.
"""

from datetime import date, time, datetime, timedelta
from typing import Optional
from django.db.models import Sum, Count, Q
from django.utils import timezone


# ─────────────────────────────────────────────────────────────────────────────
# GKP Activity identifiers
# ─────────────────────────────────────────────────────────────────────────────
GKP_ACTIVITIES = {
    'soft-play': 'Soft Play',
    'laser-arena': 'Laser Arena',
    'go-kart': 'Go Karts',
    'inflatable-park': 'Inflatable Park',
}

# ─────────────────────────────────────────────────────────────────────────────
# Capacity configuration
# These will eventually come from an AvailabilityConfig DB model.
# For now, use safe defaults that can be overridden via settings.
# ─────────────────────────────────────────────────────────────────────────────
GKP_SESSION_CAPACITY = 150       # Max total visitors per time slot
GKP_LIMITED_THRESHOLD = 0.75     # Above this percentage → LIMITED
GKP_PARTY_SLOT_CAPACITY = 30     # Max party guests per party time slot


# ─────────────────────────────────────────────────────────────────────────────
# Status constants
# ─────────────────────────────────────────────────────────────────────────────
STATUS_AVAILABLE = 'AVAILABLE'
STATUS_LIMITED = 'LIMITED'
STATUS_FULL = 'FULL'
STATUS_CLOSED = 'CLOSED'
STATUS_BLOCKED = 'BLOCKED'
STATUS_UNAVAILABLE = 'UNAVAILABLE'

DATE_STATUS_OPEN = 'OPEN'
DATE_STATUS_CLOSED = 'CLOSED'
DATE_STATUS_BLOCKED = 'BLOCKED'
DATE_STATUS_OPEN_OVERRIDE = 'OPEN_OVERRIDE'
DATE_STATUS_CLOSED_OVERRIDE = 'CLOSED_OVERRIDE'


class GKPAvailabilityService:
    """
    Central availability service for Go Kids Play Coventry.

    Usage:
        svc = GKPAvailabilityService()
        result = svc.get_full_availability('2026-09-10')
    """

    # ─── Admin override resolution ────────────────────────────────────────────

    def get_admin_override(self, check_date: date):
        """
        Return the most specific admin BookingBlock override for a given date.
        Returns None if no override exists.
        """
        from .models import BookingBlock
        # Priority: BLOCKED_DATE > CLOSED > CLOSED_TODAY > OPEN_TODAY
        # The first matching blocking type takes effect.
        blocking_types = ['BLOCKED_DATE', 'CLOSED', 'MAINTENANCE', 'PRIVATE_EVENT', 'OTHER']
        alert_types = ['CLOSED_TODAY', 'OPEN_TODAY']

        all_active_types = blocking_types + alert_types

        blocks = BookingBlock.objects.filter(
            start_date__lte=check_date,
            end_date__gte=check_date,
            type__in=all_active_types
        ).order_by(
            # blocking types take priority over alert types
            'start_date'
        )

        # Return hard blocks first, then alerts
        for block in blocks:
            if block.type in blocking_types:
                return block
        for block in blocks:
            if block.type in alert_types:
                return block
        return None

    def get_date_status(self, check_date: date) -> dict:
        """
        Determine the overall status of a date.

        Returns:
        {
            'date': '2026-09-10',
            'status': 'OPEN' | 'CLOSED' | 'BLOCKED' | 'OPEN_OVERRIDE' | 'CLOSED_OVERRIDE',
            'closure_reason': str | None,
            'override_type': str | None,
            'blocks_normal_bookings': bool,
            'blocks_party_bookings': bool,
            'has_existing_bookings': bool,
            'existing_booking_count': int,
        }
        """
        from .models import Booking, PartyBooking

        override = self.get_admin_override(check_date)
        blocks_normal = False
        blocks_party = False
        closure_reason = None
        status = DATE_STATUS_OPEN
        override_type = None

        if override:
            override_type = override.type
            closure_reason = override.reason

            if override.type in ['BLOCKED_DATE', 'CLOSED', 'MAINTENANCE', 'PRIVATE_EVENT', 'OTHER']:
                status = DATE_STATUS_BLOCKED if override.type == 'BLOCKED_DATE' else DATE_STATUS_CLOSED
                blocks_normal = True
                blocks_party = True
            elif override.type == 'CLOSED_TODAY':
                status = DATE_STATUS_CLOSED_OVERRIDE
                blocks_normal = True
                blocks_party = True
            elif override.type == 'OPEN_TODAY':
                status = DATE_STATUS_OPEN_OVERRIDE
                # Override open — don't block bookings

            # Check extended fields if they exist (added in migration 0026)
            if hasattr(override, 'blocks_normal_bookings') and override.blocks_normal_bookings is not None:
                blocks_normal = override.blocks_normal_bookings
            if hasattr(override, 'blocks_party_bookings') and override.blocks_party_bookings is not None:
                blocks_party = override.blocks_party_bookings

        # Count existing bookings (for admin warnings)
        session_count = Booking.objects.filter(
            date=check_date
        ).exclude(booking_status='CANCELLED').count()

        party_count = PartyBooking.objects.filter(
            date=check_date
        ).exclude(status='CANCELLED').count()

        return {
            'date': str(check_date),
            'status': status,
            'closure_reason': closure_reason,
            'override_type': override_type,
            'blocks_normal_bookings': blocks_normal,
            'blocks_party_bookings': blocks_party,
            'has_existing_bookings': (session_count + party_count) > 0,
            'existing_booking_count': session_count + party_count,
            'existing_session_count': session_count,
            'existing_party_count': party_count,
        }

    # ─── Session slot availability ────────────────────────────────────────────

    def get_session_slots(self, check_date: date, date_status: Optional[dict] = None) -> dict:
        """
        Return per-slot session availability for a given date.

        Default GKP session time slots (configurable via CMS):
        - Weekday: 15:00, 17:00, 19:00
        - Weekend: 10:00, 12:00, 14:00, 16:00, 18:00, 20:00

        Returns:
        {
            "10:00": {
                "slot_start": "10:00",
                "slot_end": "12:00",
                "booking_type": "SESSION",
                "total_capacity": 150,
                "booked_count": 42,
                "remaining_capacity": 108,
                "status": "AVAILABLE",
                "activity_availability": { ... }
            },
            ...
        }
        """
        from .models import Booking

        if date_status is None:
            date_status = self.get_date_status(check_date)

        # If date is fully blocked/closed, all slots unavailable
        if date_status['blocks_normal_bookings']:
            return {}

        # Determine standard slots for day of week
        weekday = check_date.weekday()  # 0=Mon, 5=Sat, 6=Sun
        is_weekend = weekday in (5, 6)

        standard_slots = (
            ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
            if is_weekend
            else ['15:00', '17:00', '19:00']
        )

        # Load all active bookings for the date
        bookings = Booking.objects.filter(
            date=check_date
        ).exclude(
            booking_status='CANCELLED'
        ).values('time', 'activity', 'adults', 'kids')

        # Aggregate headcounts per slot
        slot_headcounts = {}
        for b in bookings:
            slot = str(b['time'])[:5]
            if slot not in slot_headcounts:
                slot_headcounts[slot] = 0
            slot_headcounts[slot] += (b['adults'] or 0) + (b['kids'] or 0)

        result = {}
        for slot_str in standard_slots:
            booked = slot_headcounts.get(slot_str, 0)
            remaining = max(0, GKP_SESSION_CAPACITY - booked)
            fill_ratio = booked / GKP_SESSION_CAPACITY if GKP_SESSION_CAPACITY > 0 else 0

            if fill_ratio >= 1.0:
                slot_status = STATUS_FULL
            elif fill_ratio >= GKP_LIMITED_THRESHOLD:
                slot_status = STATUS_LIMITED
            else:
                slot_status = STATUS_AVAILABLE

            # Calculate end time (2 hours duration)
            h, m = map(int, slot_str.split(':'))
            end_h = (h + 2) % 24
            slot_end = f"{end_h:02d}:{m:02d}"

            result[slot_str] = {
                'slot_start': slot_str,
                'slot_end': slot_end,
                'booking_type': 'SESSION',
                'total_capacity': GKP_SESSION_CAPACITY,
                'booked_count': booked,
                'remaining_capacity': remaining,
                'status': slot_status,
                'activity_availability': self._get_activity_availability_for_slot(
                    check_date, slot_str
                ),
            }

        return result

    def _get_activity_availability_for_slot(self, check_date: date, slot: str) -> dict:
        """
        Return per-activity availability for a specific slot.
        Currently all GKP activities share the session capacity pool.
        Individual activity closure is via BookingBlock extended fields (future).
        """
        return {
            activity_slug: STATUS_AVAILABLE
            for activity_slug in GKP_ACTIVITIES.keys()
        }

    # ─── Party slot availability ──────────────────────────────────────────────

    def get_party_slots(self, check_date: date, date_status: Optional[dict] = None) -> dict:
        """
        Return party slot availability for a given date.

        GKP party time slots: 12:00, 14:30, 17:00
        Each slot: up to 30 party guests.

        Returns:
        {
            "12:00": {
                "slot_start": "12:00",
                "slot_end": "14:00",
                "booking_type": "PARTY",
                "total_capacity": 30,
                "booked_count": 25,
                "remaining_capacity": 5,
                "status": "LIMITED",
                "party_bookings": [{ "id": 1, "name": "Smith Party" }]
            },
            ...
        }
        """
        from .models import PartyBooking

        if date_status is None:
            date_status = self.get_date_status(check_date)

        if date_status['blocks_party_bookings']:
            return {}

        # Standard party time slots
        party_slots = ['12:00', '14:30', '17:00']

        # Load active party bookings for this date
        party_bookings = PartyBooking.objects.filter(
            date=check_date
        ).exclude(status='CANCELLED').values('time', 'id', 'name', 'kids', 'adults', 'package_name')

        slot_data = {}
        for pb in party_bookings:
            slot = str(pb['time'])[:5]
            if slot not in slot_data:
                slot_data[slot] = {'bookings': [], 'total_guests': 0}
            slot_data[slot]['bookings'].append({
                'id': pb['id'],
                'name': pb['name'],
                'package': pb['package_name'],
                'guests': (pb['kids'] or 0) + (pb['adults'] or 0),
            })
            slot_data[slot]['total_guests'] += (pb['kids'] or 0) + (pb['adults'] or 0)

        result = {}
        for slot_str in party_slots:
            slot_info = slot_data.get(slot_str, {'bookings': [], 'total_guests': 0})
            booked_count = slot_info['total_guests']
            remaining = max(0, GKP_PARTY_SLOT_CAPACITY - booked_count)
            fill_ratio = booked_count / GKP_PARTY_SLOT_CAPACITY if GKP_PARTY_SLOT_CAPACITY > 0 else 0

            if fill_ratio >= 1.0:
                slot_status = STATUS_FULL
            elif fill_ratio >= GKP_LIMITED_THRESHOLD:
                slot_status = STATUS_LIMITED
            elif slot_info['bookings']:
                slot_status = STATUS_LIMITED  # Already has a booking — treat as limited for display
            else:
                slot_status = STATUS_AVAILABLE

            # Party duration: 2 hours
            h, m = map(int, slot_str.split(':'))
            end_h = (h + 2) % 24
            slot_end = f"{end_h:02d}:{m:02d}"

            result[slot_str] = {
                'slot_start': slot_str,
                'slot_end': slot_end,
                'booking_type': 'PARTY',
                'total_capacity': GKP_PARTY_SLOT_CAPACITY,
                'booked_count': booked_count,
                'remaining_capacity': remaining,
                'status': slot_status,
                'party_bookings': slot_info['bookings'],
            }

        return result

    # ─── Capacity check (used at booking creation) ───────────────────────────

    def check_session_capacity(self, check_date: date, slot_time: str, headcount: int) -> dict:
        """
        Transactionally check whether a session booking can be accepted.
        Called inside BookingViewSet.create() within select_for_update().

        Returns:
        {
            'allowed': True | False,
            'spots_free': int,
            'spots_needed': int,
            'current_count': int,
            'max_capacity': int,
            'reason': str | None,
        }
        """
        from .models import Booking

        # ── Check date-level block ────────────────────────────────────────────
        date_status = self.get_date_status(check_date)
        if date_status['blocks_normal_bookings']:
            return {
                'allowed': False,
                'spots_free': 0,
                'spots_needed': headcount,
                'current_count': 0,
                'max_capacity': GKP_SESSION_CAPACITY,
                'reason': date_status['closure_reason'] or 'This date is not available for bookings.',
                'code': 'DATE_BLOCKED',
            }

        # ── Count current slot occupancy with select_for_update for race safety ──
        slot_prefix = str(slot_time)[:5]
        bookings_in_slot = Booking.objects.select_for_update().filter(
            date=check_date,
            time__startswith=slot_prefix,
        ).exclude(booking_status='CANCELLED').values('adults', 'kids')

        current_headcount = sum(
            (b['adults'] or 0) + (b['kids'] or 0)
            for b in bookings_in_slot
        )

        spots_free = max(0, GKP_SESSION_CAPACITY - current_headcount)

        if current_headcount + headcount > GKP_SESSION_CAPACITY:
            return {
                'allowed': False,
                'spots_free': spots_free,
                'spots_needed': headcount,
                'current_count': current_headcount,
                'max_capacity': GKP_SESSION_CAPACITY,
                'reason': (
                    f'Not enough capacity for the {slot_prefix} slot. '
                    f'{spots_free} spot(s) available, {headcount} requested.'
                ),
                'code': 'CAPACITY_EXCEEDED',
            }

        return {
            'allowed': True,
            'spots_free': spots_free,
            'spots_needed': headcount,
            'current_count': current_headcount,
            'max_capacity': GKP_SESSION_CAPACITY,
            'reason': None,
            'code': None,
        }

    def check_party_capacity(self, check_date: date, slot_time: str, headcount: int) -> dict:
        """
        Check whether a party booking can be accepted for a given slot.
        """
        from .models import PartyBooking

        date_status = self.get_date_status(check_date)
        if date_status['blocks_party_bookings']:
            return {
                'allowed': False,
                'spots_free': 0,
                'spots_needed': headcount,
                'reason': date_status['closure_reason'] or 'Party bookings are not available on this date.',
                'code': 'DATE_BLOCKED',
            }

        slot_prefix = str(slot_time)[:5]
        party_bookings = PartyBooking.objects.select_for_update().filter(
            date=check_date,
            time__startswith=slot_prefix,
        ).exclude(status='CANCELLED').values('kids', 'adults')

        current_guests = sum((b['kids'] or 0) + (b['adults'] or 0) for b in party_bookings)
        spots_free = max(0, GKP_PARTY_SLOT_CAPACITY - current_guests)

        if current_guests + headcount > GKP_PARTY_SLOT_CAPACITY:
            return {
                'allowed': False,
                'spots_free': spots_free,
                'spots_needed': headcount,
                'reason': f'Party slot {slot_prefix} is full. {spots_free} spaces remaining.',
                'code': 'CAPACITY_EXCEEDED',
            }

        return {
            'allowed': True,
            'spots_free': spots_free,
            'spots_needed': headcount,
            'reason': None,
            'code': None,
        }

    # ─── Full availability for a date ─────────────────────────────────────────

    def get_full_availability(self, check_date: date) -> dict:
        """
        Return comprehensive availability for a date.
        This is the primary response for the frontend slot-availability API.
        """
        date_status = self.get_date_status(check_date)
        session_slots = self.get_session_slots(check_date, date_status)
        party_slots = self.get_party_slots(check_date, date_status)

        return {
            'date': str(check_date),
            'date_status': date_status['status'],
            'closure_reason': date_status['closure_reason'],
            'blocks_normal_bookings': date_status['blocks_normal_bookings'],
            'blocks_party_bookings': date_status['blocks_party_bookings'],
            'session_capacity': GKP_SESSION_CAPACITY,
            'slots': session_slots,
            'party_slots': party_slots,
            'activities': list(GKP_ACTIVITIES.keys()),
        }

    # ─── Today's open/closed status (for homepage) ───────────────────────────

    def get_today_status(self) -> dict:
        """
        Return the open/closed status for today.
        Used by the homepage live status banner.
        """
        today = timezone.now().date()
        date_status = self.get_date_status(today)

        is_open = date_status['status'] in (DATE_STATUS_OPEN, DATE_STATUS_OPEN_OVERRIDE)

        # Simple check: is today within normal operating days?
        # GKP typical hours: Thu-Sun (weekday=3,4,5,6)
        weekday = today.weekday()
        normal_operating_day = weekday in (3, 4, 5, 6)  # Thu, Fri, Sat, Sun

        return {
            'date': str(today),
            'is_open': is_open and normal_operating_day and not date_status['blocks_normal_bookings'],
            'status': date_status['status'],
            'closure_reason': date_status['closure_reason'],
            'override_active': date_status['override_type'] is not None,
        }
