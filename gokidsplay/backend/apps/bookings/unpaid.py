"""
Release online bookings that were never paid for.

A website booking is saved just before the customer is sent to SumUp. If they
close the page instead of paying, the booking would hold its places (and sit in
the admin lists as "pending") forever. After HOLD_MINUTES with nothing paid it
is cancelled, which frees the places. If SumUp later reports the payment after
all, the payment check marks the booking paid and CONFIRMED again.

Runs automatically before capacity checks; can also be run on a schedule:
    python manage.py release_unpaid_bookings
"""
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

HOLD_MINUTES = 30


def release_unpaid_bookings(now=None) -> dict:
    from .models import Booking, BookingAuditLog, PartyBooking

    cutoff = (now or timezone.now()) - timedelta(minutes=HOLD_MINUTES)
    released = {'sessions': 0, 'parties': 0}

    stale_sessions = Booking.objects.filter(
        online_checkout=True, created_at__lt=cutoff, amount__gt=0, paid_amount__lte=Decimal('0'),
        payment_status__in=('PENDING', 'FAILED'),
    ).exclude(booking_status='CANCELLED')
    for booking in stale_sessions:
        old = booking.booking_status
        booking.booking_status = 'CANCELLED'
        booking.save(update_fields=['booking_status'])
        BookingAuditLog.objects.create(booking_id=booking.id, booking_type='SESSION', field_changed='booking_status',
                                       old_value=old, new_value='CANCELLED',
                                       changed_by=f'System: online payment not completed within {HOLD_MINUTES} minutes')
        released['sessions'] += 1

    stale_parties = PartyBooking.objects.filter(
        online_checkout=True, created_at__lt=cutoff, amount__gt=0, paid_amount__lte=Decimal('0'),
        payment_status__in=('PENDING', 'FAILED'),
    ).exclude(status='CANCELLED')
    for booking in stale_parties:
        old = booking.status
        booking.status = 'CANCELLED'
        booking.save(update_fields=['status'])
        BookingAuditLog.objects.create(booking_id=booking.id, booking_type='PARTY', field_changed='status',
                                       old_value=old, new_value='CANCELLED',
                                       changed_by=f'System: online payment not completed within {HOLD_MINUTES} minutes')
        released['parties'] += 1

    return released
