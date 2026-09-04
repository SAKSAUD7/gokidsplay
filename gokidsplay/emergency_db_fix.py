"""
EMERGENCY: Direct database migration script
This will add the missing booking_number columns directly to the production database
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')

try:
    django.setup()
    from django.db import connection
    from apps.bookings.models import Booking, PartyBooking
    
    print("=" * 70)
    print("EMERGENCY DATABASE MIGRATION SCRIPT")
    print("=" * 70)
    print("\nThis will add booking_number columns to production database\n")
    
    with connection.cursor() as cursor:
        # Check if columns exist
        print("1. Checking current database schema...")
        
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
        
        print(f"   - bookings_booking.booking_number exists: {booking_col_exists}")
        print(f"   - bookings_partybooking.booking_number exists: {party_col_exists}")
        
        if booking_col_exists and party_col_exists:
            print("\n✅ Both columns already exist! Migration not needed.")
            print("\nThe 500 errors must be caused by something else.")
            print("Let me check the actual error...")
            
        else:
            print("\n2. Adding missing columns...")
            
            if not booking_col_exists:
                print("   - Adding booking_number to bookings_booking...")
                cursor.execute("""
                    ALTER TABLE bookings_booking 
                    ADD COLUMN booking_number VARCHAR(50) NULL;
                """)
                print("   ✅ Column added")
            
            if not party_col_exists:
                print("   - Adding booking_number to bookings_partybooking...")
                cursor.execute("""
                    ALTER TABLE bookings_partybooking 
                    ADD COLUMN booking_number VARCHAR(50) NULL;
                """)
                print("   ✅ Column added")
            
            print("\n3. Generating booking numbers for existing records...")
            
            # Update existing bookings
            bookings = Booking.objects.filter(booking_number__isnull=True)
            count = 0
            for booking in bookings:
                booking.save()  # This triggers the auto-generation
                count += 1
            print(f"   ✅ Updated {count} session bookings")
            
            party_bookings = PartyBooking.objects.filter(booking_number__isnull=True)
            count = 0
            for booking in party_bookings:
                booking.save()
                count += 1
            print(f"   ✅ Updated {count} party bookings")
            
            print("\n✅ MIGRATION COMPLETE!")
            print("\nNext steps:")
            print("1. Refresh your admin portal")
            print("2. All 500 errors should be gone")
    
    print("\n" + "=" * 70)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print("\nThis script needs to run on the Azure server, not locally.")
    print("It's trying to connect to the production database.")
    import traceback
    traceback.print_exc()
