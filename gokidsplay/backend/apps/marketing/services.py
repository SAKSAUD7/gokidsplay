import logging
import uuid
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.apps import apps
from django.db.models import Q
from apps.emails.services import email_service
from .models import EmailUnsubscribe, MarketingCampaign, BirthdayEmailTracker, EmailTemplate

logger = logging.getLogger(__name__)

class MarketingService:
    """
    Service to handle all marketing e-mail logic:
    - Birthday automation
    - Campaign sending
    - Unsubscribe management
    """
    
    def generate_unsubscribe_token(self, email):
        """
        Generate a secure token for unsubscribing.
        Currently using a simple signed implementation or UUID storage.
        For simplicity and state, we'll implement a token-based lookup if needed, 
        or just sign the email.
        
        To be robust without complex crypto, we can just use the email directly 
        if we trust the link source, but better to sign it.
        
        For this implementation: simple base64 or similar is NOT secure.
        We will use django.core.signing.
        """
        from django.core.signing import Signer
        signer = Signer()
        return signer.sign(email)

    def verify_unsubscribe_token(self, token):
        """
        Verify token and return email if valid.
        """
        from django.core.signing import Signer, BadSignature
        signer = Signer()
        try:
            return signer.unsign(token)
        except BadSignature:
            return None

    def is_unsubscribed(self, email):
        """Check if email is unsubscribed."""
        return EmailUnsubscribe.objects.filter(email=email).exists()

    def unsubscribe_email(self, email, reason="User requested"):
        """Add email to unsubscribe list."""
        EmailUnsubscribe.objects.get_or_create(email=email, defaults={'reason': reason})

    def get_public_unsubscribe_url(self, email):
        """
        Generate the strict HTTPS URL for the public unsubscribe view.
        """
        token = self.generate_unsubscribe_token(email)
        # Assuming frontend or backend serves this. 
        # Since we are adding "ZERO BREAKS", we'll serve this via a backend view.
        # We need the domain.
        base_url = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'localhost:8000'
        if not base_url.startswith('http'):
            base_url = f"https://{base_url}"
            
        return f"{base_url}/marketing/unsubscribe/?token={token}"

    # ==========================
    # BIRTHDAY AUTOMATION
    # ==========================
    
    def send_birthday_batch(self):
        """
        Birthday automation: Find PartyBookings from previous years 
        where the anniversary of the party date is exactly 20 days from today.
        Send a reminder email to book again.
        """
        from apps.bookings.models import PartyBooking
        today = timezone.now().date()
        target_date = today + timedelta(days=20)
        
        # Find all PartyBookings matching the month and day of target_date
        # Ensure we only look at bookings from previous years to avoid sending it in the same year they booked.
        bookings = PartyBooking.objects.filter(
            date__month=target_date.month,
            date__day=target_date.day,
            date__year__lt=target_date.year,
            booking_status__in=['CONFIRMED', 'COMPLETED']
        )
        
        count = 0
        for booking in bookings:
            if not booking.email:
                continue
                
            if self.is_unsubscribed(booking.email):
                continue
                
            # Check if we already sent an email for this specific year
            if BirthdayEmailTracker.objects.filter(email=booking.email, year=target_date.year).exists():
                continue
                
            self._send_birthday_email(booking, booking.email, booking.name, target_date.year)
            count += 1
            
        logger.info(f"Birthday Batch complete. Sent {count} emails.")

    def _send_birthday_email(self, booking, email, name, year):
        """Internal helper to send birthday email and track it"""
        child_name = booking.birthday_child_name or "your child"
        child_age = f"{booking.birthday_child_age + (year - booking.date.year)}" if booking.birthday_child_age else ""
        
        try:
            email_service.send_transactional_email(
                to_email=email,
                subject=f"It's almost {child_name}'s birthday! 🎉",
                template_name='emails/birthday_reminder.html',
                context={
                    'parent_name': name,
                    'child_name': child_name,
                    'child_age': child_age,
                    'unsubscribe_url': self.get_public_unsubscribe_url(email)
                }
            )
            # Log success
            BirthdayEmailTracker.objects.create(email=email, year=year)
            logger.info(f"Sent birthday reminder to {email} for {child_name}")
        except Exception as e:
            logger.error(f"Failed to send birthday reminder to {email}: {str(e)}")

    # ==========================
    # CAMPAIGN SENDING
    # ==========================
    
    def send_campaign(self, campaign_id):
        """
        Orchestrates sending a marketing campaign.
        """
        try:
            campaign = MarketingCampaign.objects.get(id=campaign_id)
        except MarketingCampaign.DoesNotExist:
            logger.error(f"Campaign {campaign_id} not found")
            return

        if campaign.status == 'SENT':
            logger.warning(f"Campaign {campaign.title} already sent")
            return

        logger.info(f"Starting Campaign: {campaign.title}")
        
        # Resolve Recipients
        recipient_emails = self._resolve_recipients(campaign)
        
        success_count = 0
        failed_count = 0
        
        for email, name in recipient_emails:
            # Check Unsubscribe
            if self.is_unsubscribed(email):
                continue
                
            try:
                self._send_campaign_email(campaign, email, name)
                success_count += 1
            except Exception as e:
                logger.error(f"Campaign send failed for {email}: {e}")
                failed_count += 1
        
        # Update Campaign Stats
        campaign.status = 'SENT'
        campaign.sent_at = timezone.now()
        campaign.sent_count = success_count
        campaign.failed_count = failed_count
        campaign.save()
        
        logger.info(f"Campaign Completed. Success: {success_count}, Failed: {failed_count}")

    def _resolve_recipients(self, campaign):
        """
        Returns list of (email, name) tuples based on recipient_type.
        """
        Booking = apps.get_model('bookings', 'Booking')
        PartyBooking = apps.get_model('bookings', 'PartyBooking')
        recipients = set()
        
        if campaign.recipient_type == 'ALL_ADULTS' or campaign.recipient_type == 'ALL_GUARDIANS':
            pass

        elif campaign.recipient_type == 'ALL_BOOKING_CUSTOMERS':
            # Everyone who has ever made a session booking
            bookings = Booking.objects.exclude(email__isnull=True).exclude(email='').values_list('email', 'name')
            for email, name in bookings:
                if email: recipients.add((email, name))

        elif campaign.recipient_type == 'ALL_PARTY_CUSTOMERS':
            # Everyone who has ever made a party booking
            party_bookings = PartyBooking.objects.exclude(email__isnull=True).exclude(email='').values_list('email', 'name')
            for email, name in party_bookings:
                if email: recipients.add((email, name))
                
        elif campaign.recipient_type == 'CUSTOM_LIST':
            if campaign.custom_email_list:
                # Split by comma or newline
                raw_emails = campaign.custom_email_list.replace('\n', ',').split(',')
                for raw in raw_emails:
                    e = raw.strip()
                    if e:
                        recipients.add((e, "Valued Customer"))
        
        return list(recipients)

    def _send_campaign_email(self, campaign, email, name):
        """Send individual campaign email."""
        unsubscribe_url = self.get_public_unsubscribe_url(email)
        
        # If campaign has no template, use base or fail
        template_name = 'emails/marketing/campaign.html'
        
        context = {
            'name': name,
            'campaign_content': campaign.content,
            'unsubscribe_url': unsubscribe_url
        }
        
        email_service.send_email(
            email_type='MARKETING_CAMPAIGN',
            recipient_email=email,
            recipient_name=name,
            subject=campaign.subject,
            template_name=template_name,
            context=context
        )

marketing_service = MarketingService()
