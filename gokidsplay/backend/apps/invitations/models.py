from django.db import models
from apps.bookings.models import PartyBooking
import uuid

class InvitationTemplate(models.Model):
    name = models.CharField(max_length=255)
    background_image = models.ImageField(upload_to='invitation_templates/')
    default_title = models.CharField(max_length=255, default="You're Invited!")
    default_message = models.TextField(default="Come join us for a party at Ninja Inflatable Park!")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class BookingInvitation(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    booking = models.OneToOneField(PartyBooking, on_delete=models.CASCADE, related_name='invitation')
    template = models.ForeignKey(InvitationTemplate, on_delete=models.SET_NULL, null=True, related_name='invitations')
    
    # Customizable fields
    child_name = models.CharField(max_length=255, null=True, blank=True)
    party_date = models.DateField(null=True, blank=True)
    party_time = models.TimeField(null=True, blank=True)
    venue = models.CharField(max_length=255, default="Ninja Inflatable Park")
    custom_message = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invitation for {self.booking}"
