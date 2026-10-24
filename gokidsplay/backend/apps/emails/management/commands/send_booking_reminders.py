"""
E-mail a reminder the day before each visit, party and event reservation.
Runs in the daily scheduled job (POST /api/v1/core/cron/?job=daily); each booking
is reminded once (the e-mail log remembers it), so running it twice is harmless.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Send tomorrow's booking reminders"

    def handle(self, *args, **options):
        from apps.bookings.models import Booking, EventBooking, PartyBooking
        from apps.emails.notifications import reminder

        tomorrow = timezone.localdate() + timedelta(days=1)
        bookings = list(Booking.objects.filter(date=tomorrow, booking_status='CONFIRMED', payment_status='PAID')
                        .exclude(email=''))
        bookings += list(PartyBooking.objects.filter(date=tomorrow, status__in=('CONFIRMED', 'DEPOSIT_PAID'))
                         .exclude(email=''))
        bookings += list(EventBooking.objects.filter(event__date=tomorrow, status='CONFIRMED').select_related('event'))
        sent = 0
        for booking in bookings:
            if reminder(booking):
                sent += 1
        self.stdout.write(f"Reminders for {tomorrow}: {sent} sent ({len(bookings)} bookings)")
