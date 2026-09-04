"""
Script to link existing Booking and PartyBooking records to their corresponding Customer records.
"""

from django.core.management.base import BaseCommand
from apps.bookings.models import Customer, Booking, PartyBooking
from django.db import transaction

class Command(BaseCommand):
    help = 'Link existing bookings to their corresponding Customer records'

    def handle(self, *args, **kwargs):
        linked_session_count = 0
        linked_party_count = 0
        not_found_count = 0

        # Link Session Bookings
        session_bookings = Booking.objects.filter(customer__isnull=True)
        self.stdout.write(f"Found {session_bookings.count()} session bookings without customer links")

        with transaction.atomic():
            for booking in session_bookings:
                try:
                    customer = Customer.objects.get(email=booking.email)
                    booking.customer = customer
                    booking.save(update_fields=['customer'])
                    linked_session_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"Linked session booking #{booking.id} to customer {customer.name}")
                    )
                except Customer.DoesNotExist:
                    not_found_count += 1
                    self.stdout.write(
                        self.style.WARNING(f"No customer found for booking #{booking.id} ({booking.email})")
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"Error linking booking #{booking.id}: {str(e)}")
                    )

        # Link Party Bookings
        party_bookings = PartyBooking.objects.filter(customer__isnull=True)
        self.stdout.write(f"\nFound {party_bookings.count()} party bookings without customer links")

        with transaction.atomic():
            for booking in party_bookings:
                try:
                    customer = Customer.objects.get(email=booking.email)
                    booking.customer = customer
                    booking.save(update_fields=['customer'])
                    linked_party_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"Linked party booking #{booking.id} to customer {customer.name}")
                    )
                except Customer.DoesNotExist:
                    not_found_count += 1
                    self.stdout.write(
                        self.style.WARNING(f"No customer found for party booking #{booking.id} ({booking.email})")
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"Error linking party booking #{booking.id}: {str(e)}")
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSummary:\n"
                f"  Session bookings linked: {linked_session_count}\n"
                f"  Party bookings linked: {linked_party_count}\n"
                f"  Total linked: {linked_session_count + linked_party_count}\n"
                f"  Not found: {not_found_count}"
            )
        )
