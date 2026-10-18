"""
Give a voucher use back when its booking is cancelled (customer cancels, staff
cancel, unpaid online booking released) and count it again if the booking is
confirmed later (e.g. a late payment) — whichever screen or job made the change.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='bookings.Booking')
def session_voucher_follows_booking(sender, instance, created, **kwargs):
    if created:
        return
    from .services import release_voucher, restore_voucher
    if instance.booking_status == 'CANCELLED':
        release_voucher(booking=instance)
    else:
        restore_voucher(booking=instance)


@receiver(post_save, sender='bookings.PartyBooking')
def party_voucher_follows_booking(sender, instance, created, **kwargs):
    if created:
        return
    from .services import release_voucher, restore_voucher
    if instance.status == 'CANCELLED':
        release_voucher(party_booking=instance)
    else:
        restore_voucher(party_booking=instance)
