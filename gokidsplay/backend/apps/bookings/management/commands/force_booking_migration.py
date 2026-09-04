"""
Custom Django management command to force apply the booking_number migration
"""
from django.core.management.base import BaseCommand
from django.db import connection, migrations
from django.db.migrations.executor import MigrationExecutor


class Command(BaseCommand):
    help = 'Force apply booking_number migration'

    def handle(self, *args, **options):
        self.stdout.write("=" * 70)
        self.stdout.write(self.style.SUCCESS('FORCE MIGRATION: booking_number'))
        self.stdout.write("=" * 70)
        
        # Check current state
        with connection.cursor() as cursor:
            self.stdout.write("\n1. Checking current database schema...")
            
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='bookings_booking' AND column_name='booking_number';
            """)
            booking_col_exists = cursor.fetchone() is not None
            
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='bookings_partybooking' AND column_name='booking_number';
            """)
            party_col_exists = cursor.fetchone() is not None
            
            self.stdout.write(f"   bookings_booking.booking_number: {'✅ EXISTS' if booking_col_exists else '❌ MISSING'}")
            self.stdout.write(f"   bookings_partybooking.booking_number: {'✅ EXISTS' if party_col_exists else '❌ MISSING'}")
            
            if booking_col_exists and party_col_exists:
                self.stdout.write(self.style.SUCCESS("\n✅ Both columns exist! No migration needed."))
                return
            
            self.stdout.write("\n2. Applying migration...")
            
            # Run the specific migration
            from django.core.management import call_command
            try:
                call_command('migrate', 'bookings', '0016', verbosity=2)
                self.stdout.write(self.style.SUCCESS("   ✅ Migration applied"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"   ❌ Migration failed: {e}"))
                self.stdout.write("\n3. Attempting manual column addition...")
                
                if not booking_col_exists:
                    cursor.execute("""
                        ALTER TABLE bookings_booking 
                        ADD COLUMN booking_number VARCHAR(50) NULL UNIQUE;
                    """)
                    self.stdout.write("   ✅ Added booking_number to bookings_booking")
                
                if not party_col_exists:
                    cursor.execute("""
                        ALTER TABLE bookings_partybooking 
                        ADD COLUMN booking_number VARCHAR(50) NULL UNIQUE;
                    """)
                    self.stdout.write("   ✅ Added booking_number to bookings_partybooking")
            
            self.stdout.write("\n3. Generating booking numbers for existing records...")
            
            from apps.bookings.models import Booking, PartyBooking
            
            # Update session bookings
            bookings = Booking.objects.filter(booking_number__isnull=True)
            count = bookings.count()
            for booking in bookings:
                booking.save()
            self.stdout.write(f"   ✅ Updated {count} session bookings")
            
            # Update party bookings
            party_bookings = PartyBooking.objects.filter(booking_number__isnull=True)
            count = party_bookings.count()
            for booking in party_bookings:
                booking.save()
            self.stdout.write(f"   ✅ Updated {count} party bookings")
            
            self.stdout.write(self.style.SUCCESS("\n✅ MIGRATION COMPLETE!"))
            self.stdout.write("\n" + "=" * 70)
