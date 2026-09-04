import os
import django
from django.core.management import call_command
from django.db.models.signals import post_save

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

# Import signals/models to disconnect
from apps.bookings.models import Booking, PartyBooking
from apps.cms.models import ContactMessage
from apps.core.models import Notification
from apps.core.signals import create_booking_notification, create_party_booking_notification, create_contact_message_notification

print("🔌 Disconnecting signals to prevent duplication...")
# Disconnect the signals that cause side-effects during import
post_save.disconnect(create_booking_notification, sender=Booking)
post_save.disconnect(create_party_booking_notification, sender=PartyBooking)
post_save.disconnect(create_contact_message_notification, sender=ContactMessage)

try:
    print("🧹 Flushing database to ensure clean slate...")
    call_command('flush', '--no-input')
    
    print("📥 Loading data from 'data_backup_utf8.json'...")
    call_command('loaddata', 'data_backup_utf8.json')
    print("✅ SUCCESS: Data loaded without collisions!")

except Exception as e:
    print(f"❌ Error during restoration: {e}")
