"""
E-mails when a session or party booking is cancelled, whoever cancels it (customer in
My Account, staff in the admin portal, or an unpaid online booking released after 30
minutes). Confirmations are sent after payment: see apps/emails/notifications.py.
"""
import logging

from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.bookings.models import Booking, PartyBooking

logger = logging.getLogger(__name__)


def _status(obj):
    return obj.booking_status if isinstance(obj, Booking) else obj.status


@receiver(pre_save, sender=Booking)
@receiver(pre_save, sender=PartyBooking)
def remember_old_status(sender, instance, **kwargs):
    if instance.pk:
        old = sender.objects.filter(pk=instance.pk).first()
        instance._old_status = _status(old) if old else None
    else:
        instance._old_status = None


@receiver(post_save, sender=Booking)
@receiver(post_save, sender=PartyBooking)
def email_on_cancellation(sender, instance, created, **kwargs):
    if created or _status(instance) != 'CANCELLED' or getattr(instance, '_old_status', None) in (None, 'CANCELLED'):
        return
    # Never paid and booked online: it was released because the payment didn't finish
    unpaid_release = (getattr(instance, 'online_checkout', False) and not (instance.paid_amount or 0)
                      and instance.payment_status in ('PENDING', 'FAILED'))

    def send():
        try:
            from .notifications import booking_cancelled
            booking_cancelled(instance, unpaid_release=unpaid_release)
        except Exception as exc:
            logger.error(f"Cancellation e-mail failed for {instance}: {exc}", exc_info=True)

    transaction.on_commit(send)
