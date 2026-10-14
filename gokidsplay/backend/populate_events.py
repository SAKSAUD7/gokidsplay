import os
import django
from datetime import date, time, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.bookings.models import SpecialEvent

def populate_events():
    print("Populating Special Events...")
    
    # Clear existing
    SpecialEvent.objects.all().delete()
    
    events = [
        {
            "title": "Neon Halloween Party",
            "event_type": "HALLOWEEN",
            "description": "Join us for a spooky, glow-in-the-dark Halloween party! Access to soft play, laser arena, and go-karts, all under UV lights. Spooky snacks and drinks included.",
            "short_description": "Glow-in-the-dark Halloween special with UV lights and spooky snacks.",
            "status": "PUBLISHED",
            "date": date(2026, 10, 31),
            "start_time": time(17, 0),
            "end_time": time(20, 0),
            "total_capacity": 100,
            "price_per_child": 15.00,
            "price_per_adult": 5.00,
            "deposit_amount": 0.00,
            "is_public": True,
            "accent_color": "#ff0099",
            "emoji": "🎃"
        },
        {
            "title": "Christmas Winter Wonderland",
            "event_type": "CHRISTMAS",
            "description": "Meet Santa at Go Kids Play! Every child receives a special gift, plus 2 hours of play in our inflatable park and soft play area. Festive food available at the cafe.",
            "short_description": "Meet Santa, get a gift, and enjoy 2 hours of festive play.",
            "status": "PUBLISHED",
            "date": date(2026, 12, 20),
            "start_time": time(10, 0),
            "end_time": time(14, 0),
            "total_capacity": 150,
            "price_per_child": 20.00,
            "price_per_adult": 5.00,
            "deposit_amount": 10.00,
            "is_public": True,
            "accent_color": "#00f0ff",
            "emoji": "🎅"
        },
        {
            "title": "Toddler Takeover Morning",
            "event_type": "SPECIAL",
            "description": "An exclusive morning just for the little ones (Under 5s). Soft play access only, quiet music, and a relaxed environment for toddlers to explore safely.",
            "short_description": "Exclusive quiet morning for Under 5s with soft play access.",
            "status": "PUBLISHED",
            "date": date(2026, 11, 5),
            "start_time": time(9, 30),
            "end_time": time(11, 30),
            "total_capacity": 50,
            "price_per_child": 8.00,
            "price_per_adult": 0.00,
            "deposit_amount": 0.00,
            "is_public": True,
            "accent_color": "#ccff00",
            "emoji": "👶"
        }
    ]

    for event_data in events:
        SpecialEvent.objects.create(**event_data)
        
    print(f"Successfully created {len(events)} events.")

if __name__ == '__main__':
    populate_events()
