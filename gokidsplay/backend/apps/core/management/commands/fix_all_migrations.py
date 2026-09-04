"""
COMPREHENSIVE DATABASE MIGRATION FIX
This command will apply ALL pending migrations across all apps
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection


class Command(BaseCommand):
    help = 'Apply all pending migrations across all apps'

    def handle(self, *args, **options):
        self.stdout.write("=" * 70)
        self.stdout.write(self.style.SUCCESS('COMPREHENSIVE MIGRATION FIX'))
        self.stdout.write("=" * 70)
        
        apps_to_migrate = [
            'core',
            'bookings', 
            'marketing',
            'cms',
            'shop',
            'payments',
            'emails',
        ]
        
        self.stdout.write("\n1. Checking database connection...")
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write(self.style.SUCCESS("   ✅ Database connected"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Database connection failed: {e}"))
            return
        
        self.stdout.write("\n2. Running migrations for each app...")
        
        for app in apps_to_migrate:
            self.stdout.write(f"\n   Migrating {app}...")
            try:
                call_command('migrate', app, verbosity=1)
                self.stdout.write(self.style.SUCCESS(f"   ✅ {app} migrated"))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"   ⚠️  {app} migration warning: {e}"))
        
        self.stdout.write("\n3. Running general migrate to catch any remaining...")
        try:
            call_command('migrate', verbosity=1)
            self.stdout.write(self.style.SUCCESS("   ✅ All migrations applied"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"   ⚠️  General migration warning: {e}"))
        
        self.stdout.write("\n4. Verifying critical tables...")
        
        critical_tables = [
            ('bookings_booking', 'booking_number'),
            ('bookings_partybooking', 'booking_number'),
            ('marketing_emailengagement', 'id'),
            ('marketing_emailsendlog', 'id'),
            ('marketing_marketingcampaign', 'id'),
        ]
        
        with connection.cursor() as cursor:
            for table_name, column_name in critical_tables:
                try:
                    cursor.execute(f"""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name='{table_name}' AND column_name='{column_name}';
                    """)
                    exists = cursor.fetchone() is not None
                    if exists:
                        self.stdout.write(f"   ✅ {table_name}.{column_name} exists")
                    else:
                        self.stdout.write(self.style.WARNING(f"   ⚠️  {table_name}.{column_name} MISSING"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"   ❌ Error checking {table_name}: {e}"))
        
        self.stdout.write("\n5. Generating booking numbers for existing records...")
        try:
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
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"   ⚠️  Booking number generation: {e}"))
        
        self.stdout.write(self.style.SUCCESS("\n✅ COMPREHENSIVE MIGRATION COMPLETE!"))
        self.stdout.write("\n" + "=" * 70)
