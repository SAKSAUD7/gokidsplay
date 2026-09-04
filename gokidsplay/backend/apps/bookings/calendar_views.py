from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime, timedelta
from ..bookings.models import Booking, PartyBooking, BookingBlock
from ..bookings.permissions import IsStaffUser
from ..bookings.availability_service import GKPAvailabilityService


@api_view(['GET'])
@permission_classes([IsStaffUser])
def calendar_bookings(request):
    """
    Get all bookings (session + party) + availability blocks for calendar display.
    Used by the Admin Calendar.

    Returns:
      events[]   — session and party bookings
      blocks[]   — BookingBlock records (CLOSED, BLOCKED_DATE, etc.)
      party_slots — per-date party slot availability
      summary    — aggregate stats
    """
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    # Default to current month if no dates provided
    if not start_date or not end_date:
        today = datetime.now()
        start_date = today.replace(day=1).strftime('%Y-%m-%d')
        if today.month == 12:
            end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        end_date = end_date.strftime('%Y-%m-%d')

    events = []

    # ── Session bookings ──────────────────────────────────────────────────────
    session_bookings = Booking.objects.filter(
        date__gte=start_date,
        date__lte=end_date
    ).select_related('customer').order_by('date', 'time')

    for booking in session_bookings:
        start_datetime = datetime.combine(booking.date, booking.time)
        duration_minutes = getattr(booking, 'duration', 120) or 120
        end_datetime = start_datetime + timedelta(minutes=duration_minutes)

        events.append({
            'id': f'session-{booking.id}',
            'title': f'Session #{booking.id} — {booking.name}',
            'start': start_datetime.isoformat(),
            'end': end_datetime.isoformat(),
            'type': 'session',
            'bookingId': booking.id,
            'bookingNumber': booking.booking_number or str(booking.id),
            'customerName': booking.customer.name if booking.customer else booking.name,
            'customerEmail': booking.customer.email if booking.customer else booking.email,
            'customerPhone': booking.customer.phone if booking.customer else booking.phone,
            'participants': (booking.kids or 0) + (booking.adults or 0),
            'kids': booking.kids or 0,
            'adults': booking.adults or 0,
            'status': booking.booking_status or 'PENDING',
            'bookingStatus': booking.booking_status or 'PENDING',
            'paymentStatus': booking.payment_status or 'PENDING',
            'amount': float(booking.amount) if booking.amount else 0,
            'arrived': getattr(booking, 'arrived', False),
            'activity': booking.activity or 'General Session',
            'packageName': 'Session Booking',
        })

    # ── Party bookings ────────────────────────────────────────────────────────
    party_bookings = PartyBooking.objects.filter(
        date__gte=start_date,
        date__lte=end_date
    ).select_related('customer').order_by('date', 'time')

    for booking in party_bookings:
        start_datetime = datetime.combine(booking.date, booking.time)
        duration_minutes = 120  # 2-hour party slots
        end_datetime = start_datetime + timedelta(minutes=duration_minutes)

        events.append({
            'id': f'party-{booking.id}',
            'title': f'Party #{booking.id} — {booking.name}',
            'start': start_datetime.isoformat(),
            'end': end_datetime.isoformat(),
            'type': 'party',
            'bookingId': booking.id,
            'bookingNumber': booking.booking_number or str(booking.id),
            'customerName': booking.name,
            'customerEmail': booking.email,
            'customerPhone': booking.phone,
            'participants': (booking.kids or 0) + (booking.adults or 0),
            'kids': booking.kids or 0,
            'adults': booking.adults or 0,
            'status': booking.status or 'PENDING',
            'bookingStatus': booking.status or 'PENDING',
            'paymentStatus': 'PENDING',
            'amount': float(booking.amount) if booking.amount else 0,
            'arrived': getattr(booking, 'arrived', False),
            'packageName': booking.package_name or 'Party Booking',
            'birthdayChildName': booking.birthday_child_name,
            'birthdayChildAge': booking.birthday_child_age,
        })

    # ── Availability blocks (admin overrides / closures) ──────────────────────
    try:
        from datetime import date as date_type
        start_d = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_d = datetime.strptime(end_date, '%Y-%m-%d').date()

        blocks_qs = BookingBlock.objects.filter(
            start_date__lte=end_d,
            end_date__gte=start_d
        )

        blocks = []
        for block in blocks_qs:
            blocks.append({
                'id': f'block-{block.id}',
                'start': str(block.start_date),
                'end': str(block.end_date),
                'type': block.type,
                'reason': block.reason,
                'recurring': block.recurring,
            })
    except Exception:
        blocks = []

    # ── Summary ───────────────────────────────────────────────────────────────
    summary = {
        'totalBookings': len(events),
        'sessionBookings': len([e for e in events if e['type'] == 'session']),
        'partyBookings': len([e for e in events if e['type'] == 'party']),
        'totalRevenue': sum(e['amount'] for e in events),
        'totalParticipants': sum(e['participants'] for e in events),
        'blockedDates': len(blocks),
    }

    return Response({
        'events': events,
        'blocks': blocks,
        'summary': summary,
        'dateRange': {
            'start': start_date,
            'end': end_date,
        }
    })


@api_view(['GET'])
@permission_classes([IsStaffUser])
def date_availability(request):
    """
    Admin endpoint: full availability detail for a specific date.
    Used by the Admin Availability Control Panel.

    GET /api/v1/calendar/availability/?date=2026-09-10
    """
    date_str = request.GET.get('date')
    if not date_str:
        return Response({'error': 'date parameter required'}, status=400)

    try:
        check_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

    svc = GKPAvailabilityService()
    availability = svc.get_full_availability(check_date)
    return Response(availability)


@api_view(['GET'])
def today_status(request):
    """
    Public endpoint: today's open/closed status for the homepage banner.
    GET /api/v1/calendar/today/
    """
    svc = GKPAvailabilityService()
    status = svc.get_today_status()
    return Response(status)
