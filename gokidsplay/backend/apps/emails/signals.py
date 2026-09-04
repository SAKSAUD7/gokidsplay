"""
Django signals for triggering emails on booking creation.
Uses post-save signals to send confirmation emails automatically.

DISABLED: Emails are now sent AFTER payment verification.
See apps/payments/services.py - PaymentService._send_payment_success_email()
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from django.conf import settings

# Import models
from apps.bookings.models import Booking, PartyBooking

logger = logging.getLogger(__name__)


# DISABLED: Email now sent after payment, not at booking creation
# @receiver(post_save, sender=Booking)
# def send_booking_confirmation_on_create(sender, instance, created, **kwargs):
#     """
#     Send confirmation email when a new session booking is created.
#     
#     Only sends if:
#     - Booking was just created (not updated)
#     """
#     if not created:
#         return
#     
#     from .tasks import send_booking_confirmation_email
#     try:
#         send_booking_confirmation_email(instance.id)
#     except Exception as e:
#         logger.error(f"Email failed for booking {instance.id}: {e}")


# DISABLED: Email now sent after payment, not at booking creation
# @receiver(post_save, sender=PartyBooking)
# def send_party_booking_confirmation_on_create(sender, instance, created, **kwargs):
#     """
#     Send confirmation email when a new party booking is created.
#     
#     Only sends if:
#     - Party booking was just created (not updated)
#     """
#     if not created:
#         return
#     
#     from .tasks import send_party_booking_confirmation_email
#     try:
#         send_party_booking_confirmation_email(instance.id)
#     except Exception as e:
#         logger.error(f"Email failed for party booking {instance.id}: {e}")

