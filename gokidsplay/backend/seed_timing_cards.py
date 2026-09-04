"""
Seed TimingCard records for the opening hours bar shown across all pages.
Run with:
    python manage.py shell < seed_timing_cards.py
"""

from apps.cms.models import TimingCard  # type: ignore[attr-defined]

TIMING_CARDS = [
    {
        "day_label": "Mon – Fri",
        "open_time": "11:00 AM",
        "close_time": "9:00 PM",
        "note": "Last entry 8 PM",
        "icon": "Clock",
        "color": "primary",
        "order": 1,
    },
    {
        "day_label": "Saturday",
        "open_time": "10:00 AM",
        "close_time": "10:00 PM",
        "note": "Last entry 9 PM",
        "icon": "Sun",
        "color": "secondary",
        "order": 2,
    },
    {
        "day_label": "Sunday",
        "open_time": "10:00 AM",
        "close_time": "8:00 PM",
        "note": "Last entry 7 PM",
        "icon": "Moon",
        "color": "accent",
        "order": 3,
    },
]

print("\n" + "=" * 60)
print("  SEEDING TIMING CARDS")
print("=" * 60)

created = 0
updated = 0

for card_data in TIMING_CARDS:
    obj, was_created = TimingCard.objects.get_or_create(  # type: ignore[attr-defined]
        day_label=card_data["day_label"],
        defaults={
            "open_time": card_data["open_time"],
            "close_time": card_data["close_time"],
            "note": card_data.get("note", ""),
            "icon": card_data["icon"],
            "color": card_data["color"],
            "order": card_data["order"],
            "active": True,
        },
    )
    if was_created:
        created += 1
        print(f"  ✓ CREATED  → {card_data['day_label']}: {card_data['open_time']} – {card_data['close_time']}")
    else:
        # Update times in case they changed
        obj.open_time = card_data["open_time"]
        obj.close_time = card_data["close_time"]
        obj.note = card_data.get("note", "")
        obj.active = True
        obj.save(update_fields=["open_time", "close_time", "note", "active"])
        updated += 1
        print(f"  ↻ UPDATED  → {card_data['day_label']}: {card_data['open_time']} – {card_data['close_time']}")

print("\n" + "=" * 60)
print(f"  Created: {created}  |  Updated: {updated}")
print("=" * 60)
print("\nOpening hours bar will now appear across all pages.\n")
