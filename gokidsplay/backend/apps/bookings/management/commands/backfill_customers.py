from django.core.management.base import BaseCommand
from apps.bookings.models import Customer, Booking, PartyBooking


class Command(BaseCommand):
    help = 'Backfill customer records for existing bookings'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        created_customers = 0
        linked_bookings = 0
        linked_parties = 0
        skipped = 0
        
        # Process regular bookings
        bookings = Booking.objects.filter(customer__isnull=True)
        self.stdout.write(f'Found {bookings.count()} bookings without customers')
        
        for booking in bookings:
            if not booking.email:
                self.stdout.write(
                    self.style.WARNING(f'  Skipping booking {booking.id} - no email')
                )
                skipped += 1
                continue
            
            if not dry_run:
                customer, created = Customer.objects.get_or_create(
                    email=booking.email,
                    defaults={
                        'name': booking.name,
                        'phone': booking.phone
                    }
                )
                
                booking.customer = customer
                booking.save(update_fields=['customer'])
                
                if created:
                    created_customers += 1
                    self.stdout.write(f'  Created customer: {customer.email}')
                else:
                    self.stdout.write(f'  Linked to existing customer: {customer.email}')
                linked_bookings += 1
            else:
                # Check if customer would be created
                exists = Customer.objects.filter(email=booking.email).exists()
                if not exists:
                    created_customers += 1
                linked_bookings += 1
        
        # Process party bookings
        party_bookings = PartyBooking.objects.filter(customer__isnull=True)
        self.stdout.write(f'\\nFound {party_bookings.count()} party bookings without customers')
        
        for pb in party_bookings:
            if not pb.email:
                self.stdout.write(
                    self.style.WARNING(f'  Skipping party booking {pb.id} - no email')
                )
                skipped += 1
                continue
            
            if not dry_run:
                customer, created = Customer.objects.get_or_create(
                    email=pb.email,
                    defaults={
                        'name': pb.name,
                        'phone': pb.phone
                    }
                )
                
                pb.customer = customer
                pb.save(update_fields=['customer'])
                
                if created:
                    created_customers += 1
                    self.stdout.write(f'  Created customer: {customer.email}')
                else:
                    self.stdout.write(f'  Linked to existing customer: {customer.email}')
                linked_parties += 1
            else:
                exists = Customer.objects.filter(email=pb.email).exists()
                if not exists:
                    created_customers += 1
                linked_parties += 1
        
        # Summary
        self.stdout.write(self.style.SUCCESS('\\n=== SUMMARY ==='))
        self.stdout.write(f'New customers created: {created_customers}')
        self.stdout.write(f'Session bookings linked: {linked_bookings}')
        self.stdout.write(f'Party bookings linked: {linked_parties}')
        self.stdout.write(f'Total bookings processed: {linked_bookings + linked_parties}')
        self.stdout.write(f'Skipped (no email): {skipped}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\\nThis was a DRY RUN - run without --dry-run to apply changes'))
        else:
            self.stdout.write(self.style.SUCCESS('\\n✅ Backfill complete!'))
