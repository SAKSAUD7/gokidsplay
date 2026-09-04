import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.cms.models import TimingCard

def update_timing_cards():
    print("Deleting existing Timing Cards...")
    TimingCard.objects.all().delete()
    
    schedule = [
        {"day": "Monday", "open": "CLOSED", "close": "", "icon": "Moon", "active": True},
        {"day": "Tuesday", "open": "14:00", "close": "22:00", "icon": "Clock", "active": True},
        {"day": "Wednesday", "open": "14:00", "close": "22:00", "icon": "Clock", "active": True},
        {"day": "Thursday", "open": "14:00", "close": "22:00", "icon": "Clock", "active": True},
        {"day": "Friday", "open": "14:00", "close": "22:00", "icon": "Clock", "active": True},
        {"day": "Saturday", "open": "12:00", "close": "23:00", "icon": "Sun", "active": True},
        {"day": "Sunday", "open": "12:00", "close": "22:00", "icon": "Sun", "active": True},
    ]

    for i, s in enumerate(schedule):
        print(f"Creating card for {s['day']}...")
        TimingCard.objects.create(
            day_label=s["day"],
            open_time=s["open"],
            close_time=s["close"],
            icon=s["icon"],
            color="primary",
            active=s["active"],
            order=i
        )
    print("Timing Cards successfully updated!")

if __name__ == "__main__":
    update_timing_cards()

