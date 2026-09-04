from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.bookings.models import Booking, PartyBooking
from .models import Notification

@receiver(post_save, sender=Booking)
def create_booking_notification(sender, instance, created, **kwargs):
    """Create notification when a new booking is created"""
    if created:
        Notification.objects.create(
            type='BOOKING',
            title='New Session Booking',
            message=f'New booking from {instance.name} for {instance.date}',
            link=f'/admin/bookings/{instance.id}',
            booking_id=instance.id
        )

@receiver(post_save, sender=PartyBooking)
def create_party_booking_notification(sender, instance, created, **kwargs):
    """Create notification when a new party booking is created"""
    if created:
        Notification.objects.create(
            type='PARTY_BOOKING',
            title='New Party Booking',
            message=f'New party booking from {instance.name} for {instance.date}',
            link=f'/admin/party-bookings/{instance.id}',
            party_booking_id=instance.id
        )

# Check if ContactMessage model exists before creating signal
try:
    from apps.cms.models import ContactMessage
    
    @receiver(post_save, sender=ContactMessage)
    def create_contact_message_notification(sender, instance, created, **kwargs):
        """Create notification when a new contact message is received"""
        if created:
            # Truncate message for notification preview
            message_preview = instance.message[:50] + '...' if len(instance.message) > 50 else instance.message
            Notification.objects.create(
                type='CONTACT_MESSAGE',
                title='New Contact Message',
                message=f'Message from {instance.name} ({instance.email}): {message_preview}',
                link=f'/admin/cms/contact-messages/{instance.id}',
                contact_message_id=instance.id
            )
except ImportError:
    # ContactMessage model doesn't exist yet
    pass
