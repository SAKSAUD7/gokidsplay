"""
Django signals to automatically create Customer records when bookings are created.
"""

from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Booking, PartyBooking, Customer

@receiver(pre_save, sender=Booking)
def create_customer_for_booking(sender, instance, **kwargs):
    """
    Automatically create or link a Customer record when a Booking is created.
    """
    if not instance.customer and instance.email:
        # Try to find existing customer by email
        customer, created = Customer.objects.get_or_create(
            email=instance.email,
            defaults={
                'name': instance.name,
                'phone': instance.phone,
            }
        )
        
        # Update customer info if it was just created or if fields are empty
        if created or not customer.name:
            customer.name = instance.name
            customer.phone = instance.phone
            customer.save()
        
        # Link the booking to the customer
        instance.customer = customer

@receiver(pre_save, sender=PartyBooking)
def create_customer_for_party_booking(sender, instance, **kwargs):
    """
    Automatically create or link a Customer record when a PartyBooking is created.
    """
    if not instance.customer and instance.email:
        # Try to find existing customer by email
        customer, created = Customer.objects.get_or_create(
            email=instance.email,
            defaults={
                'name': instance.name,
                'phone': instance.phone,
            }
        )
        
        # Update customer info if it was just created or if fields are empty
        if created or not customer.name:
            customer.name = instance.name
            customer.phone = instance.phone
            customer.save()
        
        # Link the booking to the customer
        instance.customer = customer
