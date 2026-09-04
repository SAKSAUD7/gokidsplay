import logging
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from apps.bookings.models import Booking
from apps.emails.services import email_service

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Sends post-visit thank you emails to customers who had bookings yesterday'

    def handle(self, *args, **options):
        yesterday = date.today() - timedelta(days=1)
        self.stdout.write(f"Starting post-visit email job for bookings on {yesterday}")
        
        # Only target confirmed and completed bookings
        bookings = Booking.objects.filter(
            date=yesterday, 
            status__in=['CONFIRMED', 'COMPLETED']
        )
        
        count = 0
        for booking in bookings:
            try:
                # Check if we already sent a thank you email
                # This prevents duplicate sends if the script is run multiple times
                if booking.email_logs.filter(email_type='POST_VISIT_THANK_YOU').exists():
                    self.stdout.write(f"Skipping {booking.id} - Thank you email already sent")
                    continue
                    
                # Send the email
                email_service.send_post_visit_thank_you(booking)
                count += 1
                self.stdout.write(self.style.SUCCESS(f"Sent post-visit email for booking {booking.id} to {booking.email}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to send email for booking {booking.id}: {str(e)}"))
                logger.error(f"Post-visit email failed for booking {booking.id}: {str(e)}")

        self.stdout.write(self.style.SUCCESS(f"Job completed. Sent {count} post-visit thank you emails."))
