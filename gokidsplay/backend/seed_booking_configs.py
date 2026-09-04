"""
Seed SessionBookingConfig and PartyBookingConfig for SpinPin.
Run from the backend directory: python seed_booking_configs.py
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.cms.models import SessionBookingConfig, PartyBookingConfig

print("🌱 Seeding SessionBookingConfig...")

session_config, created = SessionBookingConfig.objects.get_or_create(
    id=1,
    defaults={
        # Ticket prices
        'adult_price': '9.95',
        'adult_label': 'Adult',
        'adult_description': 'Aged 16+',
        'kid_price': '9.95',
        'kid_label': 'Child',
        'kid_description': 'Aged 3–15',
        'spectator_price': '2.95',
        'spectator_label': 'Spectator',
        'spectator_description': 'Non-participants',
        # Add-on prices
        'skate_hire_price': '2.95',
        'shoe_hire_price': '1.50',
        'locker_hire_price': '2.00',
        'token_pack_20_price': '5.00',
        'token_pack_50_price': '10.00',
        'parking_price': '3.00',
        # Settings
        'gst_rate': '0.00',
        'duration_minutes': 60,
        'duration_label': '60-min Session',
        'duration_description': 'Standard session duration',
        'active': True,
    }
)

if created:
    print("  ✅ SessionBookingConfig created:")
    print("     Adult: £9.95 | Child: £9.95 | Spectator: £2.95")
    print("     Skate hire: £2.95 | Shoe hire: £1.50 | Locker: £2.00")
    print("     Token pack 20: £5.00 | Token pack 50: £10.00 | Parking: £3.00")
else:
    # Update existing with correct SpinPin prices
    session_config.adult_price = '9.95'
    session_config.kid_price = '9.95'
    session_config.spectator_price = '2.95'
    session_config.skate_hire_price = '2.95'
    session_config.shoe_hire_price = '1.50'
    session_config.locker_hire_price = '2.00'
    session_config.token_pack_20_price = '5.00'
    session_config.token_pack_50_price = '10.00'
    session_config.parking_price = '3.00'
    session_config.active = True
    session_config.save()
    print("  🔄 Updated existing SessionBookingConfig with SpinPin prices")

print("\n🌱 Seeding PartyBookingConfig...")

party_config, party_created = PartyBookingConfig.objects.get_or_create(
    id=1,
    defaults={
        'participant_price': '15.00',
        'participant_label': 'Party Guest',
        'participant_description': 'Includes session + party room',
        'spectator_price': '0.00',
        'free_spectators': 2,
        'spectator_label': 'Accompanying Adult',
        'spectator_description': 'Non-participating adults (first 2 free)',
        'min_participants': 10,
        'gst_rate': '0.00',
        'deposit_percentage': '20.00',
        'package_inclusions': [
            '60-minute skating or bowling session',
            'Dedicated party room for 1 hour',
            'Party host',
            'Decorations & balloons'
        ],
        'available_time_slots': [
            '10:00', '11:00', '12:00', '13:00',
            '14:00', '15:00', '16:00', '17:00', '18:00'
        ],
        'duration_label': '60-min Session + 60-min Party Room',
        'active': True,
    }
)

if party_created:
    print("  ✅ PartyBookingConfig created:")
    print("     Party guest price: £15.00")
    print("     Min participants: 10 | First 2 spectators free")
    print("     Deposit: 20%")
else:
    party_config.participant_price = '15.00'
    party_config.min_participants = 10
    party_config.deposit_percentage = '20.00'
    party_config.active = True
    party_config.save()
    print("  🔄 Updated existing PartyBookingConfig")

print("\n🎉 Done! Booking configs seeded.")
print("   Manage prices at: http://localhost:9000/django-admin/ → CMS → Session Booking Config")
