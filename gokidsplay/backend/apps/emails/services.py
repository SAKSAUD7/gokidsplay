"""
Email Service for sending emails via Azure Communication Services.
This service is reusable and handles all email sending logic.
"""

import logging
from typing import Dict, Any, Optional
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from .models import EmailLog

logger = logging.getLogger(__name__)

ACTIVITY_NAMES = {
    'all-access': 'All-Access Play Session',
    'soft-play': 'Mega Soft Play',
    'laser-arena': 'Laser Arena',
    'go-karts': 'Go Karts',
    'inflatable-park': 'Inflatable Park',
}


def activity_display_name(activity: Optional[str]) -> str:
    """Customer-facing name for a booking's activity slug."""
    if not activity:
        return 'Play Session'
    return ACTIVITY_NAMES.get(activity, activity.replace('-', ' ').title())


class EmailService:
    """
    Service for sending emails via Azure Communication Services.
    Handles template rendering, logging, and Azure API integration.
    """
    
    def __init__(self):
        self.sender_address = getattr(settings, 'AZURE_EMAIL_SENDER_ADDRESS', 'hello@gokidsplay.co.uk')
        self.sender_name = getattr(settings, 'AZURE_EMAIL_SENDER_NAME', 'Go Kids Play')
        self.connection_string = getattr(settings, 'AZURE_COMMUNICATION_CONNECTION_STRING', '')
        
    @property
    def enabled(self):
        return getattr(settings, 'EMAIL_ENABLED', False)
        
    @property
    def debug_mode(self):
        return getattr(settings, 'EMAIL_DEBUG_MODE', False)
    
    def send_email(
        self,
        email_type: str,
        recipient_email: str,
        recipient_name: str,
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        booking=None,
        party_booking=None,
        contact_message=None,
        reply_to: Optional[str] = None,
    ) -> EmailLog:
        """
        Send an email and create EmailLog entry.
        
        Args:
            email_type: Type of email (from EmailLog.EMAIL_TYPE_CHOICES)
            recipient_email: Email address of recipient
            recipient_name: Name of recipient
            subject: Email subject line
            template_name: Template file path (e.g., 'emails/booking/session_confirmation.html')
            context: Template context variables
            booking: Optional Booking instance
            party_booking: Optional PartyBooking instance
            contact_message: Optional ContactMessage instance
        
        Returns:
            EmailLog instance
        """
        
        # Values every template can use (links back to the site, footer year)
        from apps.core.models import GlobalSettings
        site = GlobalSettings.objects.first()
        context = {
            'site_url': getattr(settings, 'FRONTEND_URL', '').rstrip('/'),
            'current_year': timezone.now().year,
            # Contact details from Admin → Settings
            'contact_email': getattr(site, 'contact_email', '') or 'info@gokidsplay.co.uk',
            'contact_phone': getattr(site, 'contact_phone', '') or '',
            **context,
        }

        # Create a JSON-serializable copy of context (without model instances)
        from decimal import Decimal
        serializable_context = {}
        for key, value in context.items():
            # Skip model instances - they're already linked via foreign keys
            if hasattr(value, '_meta'):  # Django model instance
                continue
            # Convert Decimal to string
            elif isinstance(value, Decimal):
                serializable_context[key] = str(value)
            # Convert dates/times to strings
            elif hasattr(value, 'isoformat'):
                serializable_context[key] = value.isoformat()
            else:
                serializable_context[key] = value
        
        # Create EmailLog entry
        email_log = EmailLog.objects.create(
            email_type=email_type,
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            subject=subject,
            template_name=template_name,
            context_data=serializable_context,  # Use serializable version
            status='PENDING',
            booking=booking,
            party_booking=party_booking,
            contact_message=contact_message,
        )
        
        # Check if emails are enabled
        if not self.enabled:
            logger.info(f"Email disabled by feature flag: {email_type} to {recipient_email}")
            email_log.mark_failed("Email sending disabled by EMAIL_ENABLED flag")
            return email_log
        
        # Debug mode: log instead of sending
        if self.debug_mode:
            logger.info(f"[DEBUG MODE] Would send email: {email_type} to {recipient_email}")
            logger.info(f"[DEBUG MODE] Subject: {subject}")
            logger.info(f"[DEBUG MODE] Template: {template_name}")
            logger.info(f"[DEBUG MODE] Context: {serializable_context}")
            email_log.mark_failed("Debug mode enabled - email not sent")
            return email_log
        
        try:
            # Render email template (use full context with model instances)
            html_content = render_to_string(template_name, context)
            
            # Replies go to the Go Kids Play inbox (Admin → Settings → contact e-mail) unless the
            # caller says otherwise (e.g. team notices reply straight to the customer)
            message_id = self._send_with_fallback(
                recipient_email=recipient_email,
                recipient_name=recipient_name,
                subject=subject,
                html_content=html_content,
                reply_to=reply_to or context.get('contact_email'),
            )
            
            # Mark as sent
            email_log.mark_sent(message_id=message_id)
            logger.info(f"Email sent successfully: {email_type} to {recipient_email} (ID: {message_id})")
            
        except Exception as e:
            # Mark as failed
            error_message = f"Failed to send email: {str(e)}"
            email_log.mark_failed(error_message)
            logger.error(f"Email sending failed: {email_type} to {recipient_email} - {error_message}")
        
        return email_log
    
    def _send_with_fallback(
        self,
        recipient_email: str,
        recipient_name: str,
        subject: str,
        html_content: str,
        reply_to: Optional[str] = None,
    ) -> str:
        """
        Try Azure Communication Services first. If that fails (e.g. DomainNotLinked),
        automatically fall back to Django SMTP.
        """
        # Try Azure if connection string is configured
        if self.connection_string:
            try:
                return self._send_via_azure(
                    recipient_email=recipient_email,
                    subject=subject,
                    html_content=html_content,
                    reply_to=reply_to,
                )
            except Exception as azure_error:
                logger.warning(
                    f"Azure email failed ({azure_error}), falling back to SMTP."
                )
        
        # Fall back to Django SMTP
        return self._send_via_smtp(
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            subject=subject,
            html_content=html_content,
            reply_to=reply_to,
        )

    def _send_via_smtp(
        self,
        recipient_email: str,
        recipient_name: str,
        subject: str,
        html_content: str,
        reply_to: Optional[str] = None,
    ) -> str:
        """
        Send email via Django's built-in SMTP backend.
        Uses EMAIL_HOST / EMAIL_HOST_USER / EMAIL_HOST_PASSWORD from settings.
        """
        from django.core.mail import EmailMultiAlternatives
        from django.conf import settings as django_settings
        import uuid

        from_name = getattr(django_settings, 'EMAIL_SENDER_NAME', 'Go Kids Play Coventry')
        from_email = getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'info@gokidsplay.co.uk')
        from_header = f"{from_name} <{from_email}>"

        msg = EmailMultiAlternatives(
            subject=subject,
            body="Please view this email in an HTML-compatible client.",
            from_email=from_header,
            to=[f"{recipient_name} <{recipient_email}>"] if recipient_name else [recipient_email],
            reply_to=[reply_to] if reply_to else None,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)

        logger.info(f"Email sent via SMTP to {recipient_email}")
        return f"smtp-{uuid.uuid4().hex[:12]}"

    def _send_via_azure(
        self,
        recipient_email: str,
        subject: str,
        html_content: str,
        reply_to: Optional[str] = None,
    ) -> str:
        """
        Send email via Azure Communication Services.
        
        Args:
            recipient_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
        
        Returns:
            Message ID from Azure
        
        Raises:
            Exception: If sending fails
        """
        
        # Check credentials
        if not self.connection_string:
            raise ValueError("AZURE_COMMUNICATION_CONNECTION_STRING not configured")
        
        if not self.sender_address:
            raise ValueError("AZURE_EMAIL_SENDER_ADDRESS not configured")
        
        try:
            # Import Azure SDK
            from azure.communication.email import EmailClient
            
            # Create email client
            client = EmailClient.from_connection_string(self.connection_string)
            
            # Prepare email message (dict-based API)
            message = {
                "content": {
                    "subject": subject,
                    "html": html_content
                },
                "recipients": {
                    "to": [
                        {"address": recipient_email}
                    ]
                },
                "senderAddress": self.sender_address
            }
            if reply_to:
                message["replyTo"] = [{"address": reply_to}]
            
            # Send email
            poller = client.begin_send(message)
            result = poller.result()
            
            # Return message ID
            if isinstance(result, dict):
                return result.get("messageId") or result.get("id")
            return result.message_id
            
        except ImportError:
            raise Exception("Azure Communication Email SDK not installed. Run: pip install azure-communication-email")
        except Exception as e:
            raise Exception(f"Azure email sending failed: {str(e)}")
    
    def _render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Render email template to HTML string.
        
        Args:
            template_name: Template file path
            context: Template context variables
        
        Returns:
            Rendered HTML content
        """
        from datetime import datetime
        
        # Add current year to context
        context['current_year'] = datetime.now().year
        
        return render_to_string(template_name, context)
    
    def send_booking_confirmation(self, booking, extra_context=None):
        """
        Send session booking confirmation email.
        
        Args:
            booking: Booking instance
        """
        
        # Format activity name
        activity_name = activity_display_name(booking.activity)

        context = {
            'booking': booking,
            'customer_name': booking.name,
            'booking_date': booking.date,
            'booking_time': booking.time,
            'duration': booking.duration,
            'adults': booking.adults,
            'kids': booking.kids,
            'spectators': booking.spectators,
            'amount': booking.amount,
            'booking_uuid': str(booking.uuid),
            'activity_name': activity_name,
            **(extra_context or {}),
        }
        
        return self.send_email(
            email_type='BOOKING_CONFIRMATION',
            recipient_email=booking.email,
            recipient_name=booking.name,
            subject=f'Booking confirmed – {booking.booking_number or "Go Kids Play"}',
            template_name='emails/booking/session_confirmation.html',
            context=context,
            booking=booking
        )
    
    def send_post_visit_thank_you(self, booking):
        """
        Send a post-visit thank you email for a session booking.
        """
        
        # Format activity name
        activity_name = activity_display_name(booking.activity)

        context = {
            'booking': booking,
            'customer_name': booking.name,
            'activity_name': activity_name,
        }
        
        email_log = self.send_email(
            email_type='POST_VISIT_THANK_YOU',
            recipient_email=booking.email,
            recipient_name=booking.name,
            subject=f'Thank You for Visiting Go Kids Play! ⭐',
            template_name='emails/booking/post_visit_thank_you.html',
            context=context,
            booking=booking
        )
        
        return email_log

    def send_party_booking_confirmation(self, party_booking, extra_context=None):
        """
        Send party booking confirmation email.
        
        Args:
            party_booking: PartyBooking instance
        """
        
        context = {
            'party_booking': party_booking,
            'customer_name': party_booking.name,
            'booking_date': party_booking.date,
            'booking_time': party_booking.time,
            'package_name': party_booking.package_name,
            'kids': party_booking.kids,
            'adults': party_booking.adults,
            'amount': party_booking.amount,
            'birthday_child_name': party_booking.birthday_child_name,
            'birthday_child_age': party_booking.birthday_child_age,
            'booking_uuid': str(party_booking.uuid),
            **(extra_context or {}),
        }
        
        return self.send_email(
            email_type='PARTY_BOOKING_CONFIRMATION',
            recipient_email=party_booking.email,
            recipient_name=party_booking.name,
            subject=f'Party booked – {party_booking.booking_number or "Go Kids Play"} 🎉',
            template_name='emails/booking/party_confirmation.html',
            context=context,
            party_booking=party_booking
        )


    def send_admin_contact_notification(self, contact_message):
        """
        Send admin notification for new contact message.
        
        Args:
            contact_message: ContactMessage instance
        """
        logger.info(f"Preparing to send admin contact notification for ID {contact_message.id}")
        
        context = {
            'contact_message': contact_message,
            'customer_name': contact_message.name,
            'reference': contact_message.ticket_id or f"#{contact_message.id}",
            'admin_url': f"{getattr(settings, 'FRONTEND_URL', '').rstrip('/')}/admin/cms/contact-messages",
        }
        
        from .notifications import staff_recipients
        email_log = None
        for admin_email in staff_recipients():
            email_log = self.send_email(
                email_type='ADMIN_CONTACT_MESSAGE',
                recipient_email=admin_email,
                recipient_name="Go Kids Play team",
                subject=f'New contact message – {contact_message.name}',
                template_name='emails/admin/contact_message.html',
                context=context,
                contact_message=contact_message,
                reply_to=contact_message.email,  # press Reply to answer the customer
            )
        return email_log
        
    def send_contact_customer_confirmation(self, contact_message):
        """
        Send confirmation to customer that their message was received.
        """
        logger.info(f"Preparing to send contact confirmation to customer {contact_message.email}")
        
        context = {
            'contact_message': contact_message,
            'customer_name': contact_message.name,
            'reference': contact_message.ticket_id or f"#{contact_message.id}",
        }
        
        email_log = self.send_email(
            email_type='CONTACT_CONFIRMATION',
            recipient_email=contact_message.email,
            recipient_name=contact_message.name,
            subject='We have received your enquiry - Go Kids Play',
            template_name='emails/contact_confirmation.html',
            context=context,
            contact_message=contact_message
        )
        
        return email_log

    def send_waiver_confirmation(self, waiver):
        """
        Send waiver signing confirmation email.
        
        Args:
            waiver: Waiver instance
        """
        logger.info(f"Preparing to send waiver confirmation for Waiver ID {waiver.id}")
        
        # Determine booking reference string
        booking_ref = "Walk-in"
        if waiver.booking:
            booking_ref = f"Session #{waiver.booking.id}"
        elif waiver.party_booking:
            booking_ref = f"Party #{waiver.party_booking.id}"
            
        context = {
            'waiver': waiver,
            'name': waiver.name,
            'signed_at': waiver.signed_at,
            'waiver_id': waiver.id,
            'booking_reference': booking_ref,
        }
        
        email_log = self.send_email(
            email_type='WAIVER_CONFIRMATION',
            recipient_email=waiver.email,
            recipient_name=waiver.name,
            subject=f'Waiver Confirmation - Go Kids Play',
            template_name='emails/waiver_confirmation.html',
            context=context,
        )
        
        return email_log


# Singleton instance
email_service = EmailService()
