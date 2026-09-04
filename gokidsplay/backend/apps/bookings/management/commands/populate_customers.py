"""
Script to populate Customer table from existing Booking and PartyBooking data.
This will extract unique customer information from bookings and create Customer records.
"""

from django.core.management.base import BaseCommand
from apps.bookings.models import Customer, Booking, PartyBooking
from django.db import transaction

class Command(BaseCommand):
    help = 'Populate Customer table from existing bookings'

    def handle(self, *args, **kwargs):
        created_count = 0
        updated_count = 0
        skipped_count = 0

        # Get all unique emails from Bookings
        session_bookings = Booking.objects.all()
        party_bookings = PartyBooking.objects.all()

        # Combine all bookings
        all_bookings = []
        
        for booking in session_bookings:
            all_bookings.append({
                'name': booking.name,
                'email': booking.email,
                'phone': booking.phone,
            })
        
        for booking in party_bookings:
            all_bookings.append({
                'name': booking.name,
                'email': booking.email,
                'phone': booking.phone,
            })

        # Create a dictionary to store unique customers by email
        unique_customers = {}
        for booking_data in all_bookings:
            email = booking_data['email']
            if email and email not in unique_customers:
                unique_customers[email] = booking_data

        self.stdout.write(f"Found {len(unique_customers)} unique customer emails")

        # Create or update Customer records
        with transaction.atomic():
            for email, customer_data in unique_customers.items():
                try:
                    customer, created = Customer.objects.get_or_create(
                        email=email,
                        defaults={
                            'name': customer_data['name'],
                            'phone': customer_data['phone'],
                        }
                    )
                    
                    if created:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"Created customer: {customer.name} ({customer.email})")
                        )
                    else:
                        # Update existing customer if name or phone is missing
                        updated = False
                        if not customer.name and customer_data['name']:
                            customer.name = customer_data['name']
                            updated = True
                        if not customer.phone and customer_data['phone']:
                            customer.phone = customer_data['phone']
                            updated = True
                        
                        if updated:
                            customer.save()
                            updated_count += 1
                            self.stdout.write(
                                self.style.WARNING(f"Updated customer: {customer.name} ({customer.email})")
                            )
                        else:
                            skipped_count += 1
                
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"Error processing {email}: {str(e)}")
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSummary:\n"
                f"  Created: {created_count}\n"
                f"  Updated: {updated_count}\n"
                f"  Skipped: {skipped_count}\n"
                f"  Total: {len(unique_customers)}"
            )
        )
