"""
Seed Leicester City Council school holiday dates 2025/2026 and 2026/2027
Extracted from the official Leicester City Council school holiday calendars.
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from django.db import transaction
from datetime import date, timedelta

def date_range(start, end):
    """Generate all dates from start to end inclusive."""
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)

# ── School holiday periods for 2025/2026 ──────────────────────────────────────
HOLIDAYS_2025_2026 = [
    # Autumn Half Term 2025
    (date(2025, 10, 20), date(2025, 10, 24), "Autumn Half Term 2025"),
    # Christmas 2025
    (date(2025, 12, 20), date(2026,  1,  4), "Christmas & New Year 2025/26"),
    # Spring Half Term 2026
    (date(2026,  2, 16), date(2026,  2, 20), "Spring Half Term 2026"),
    # Easter 2026
    (date(2026,  3, 30), date(2026,  4, 10), "Easter 2026"),
    # May Bank Holiday 2026
    (date(2026,  5,  4), date(2026,  5,  4), "May Bank Holiday 2026"),
    # Summer Half Term 2026
    (date(2026,  5, 25), date(2026,  5, 29), "Summer Half Term 2026"),
    # Summer Holiday 2026
    (date(2026,  7,  8), date(2026,  8, 23), "Summer Holiday 2026"),
]

# ── School holiday periods for 2026/2027 ──────────────────────────────────────
HOLIDAYS_2026_2027 = [
    # Bank Holiday
    (date(2026,  8, 31), date(2026,  8, 31), "August Bank Holiday 2026"),
    # Autumn Half Term 2026
    (date(2026, 10, 19), date(2026, 10, 23), "Autumn Half Term 2026"),
    # Christmas 2026
    (date(2026, 12, 21), date(2027,  1,  1), "Christmas & New Year 2026/27"),
    # Spring Half Term 2027
    (date(2027,  2, 15), date(2027,  2, 19), "Spring Half Term 2027"),
    # Easter 2027
    (date(2027,  3, 22), date(2027,  4,  2), "Easter 2027"),
    # May Bank Holiday 2027
    (date(2027,  5,  3), date(2027,  5,  3), "May Bank Holiday 2027"),
    # Summer Half Term 2027
    (date(2027,  5, 31), date(2027,  6,  4), "Summer Half Term 2027"),
    # Summer Holiday 2027
    (date(2027,  7, 12), date(2027,  8, 27), "Summer Holiday 2027"),
]

ALL_HOLIDAYS = HOLIDAYS_2025_2026 + HOLIDAYS_2026_2027

with transaction.atomic():
    # Try the Holiday model from apps/bookings or apps/cms
    try:
        from apps.bookings.models import SchoolHoliday
        MODEL = SchoolHoliday
        NAME_FIELD = 'name'
        START_FIELD = 'start_date'
        END_FIELD = 'end_date'
        print("Using apps.bookings.SchoolHoliday")
    except ImportError:
        try:
            from apps.cms.models import SchoolHoliday
            MODEL = SchoolHoliday
            NAME_FIELD = 'name'
            START_FIELD = 'start_date'
            END_FIELD = 'end_date'
            print("Using apps.cms.SchoolHoliday")
        except ImportError:
            MODEL = None
            print("SchoolHoliday model not found — will check Holiday model")

    if MODEL is None:
        try:
            from apps.bookings.models import Holiday
            MODEL = Holiday
            # Check fields
            field_names = [f.name for f in MODEL._meta.get_fields()]
            print(f"Using Holiday model, fields: {field_names}")
            NAME_FIELD = 'name' if 'name' in field_names else 'title'
            START_FIELD = 'start_date' if 'start_date' in field_names else 'date'
            END_FIELD = 'end_date' if 'end_date' in field_names else None
        except ImportError:
            print("ERROR: No suitable model found")
            MODEL = None

    if MODEL:
        deleted = MODEL.objects.filter(
            **{f"{START_FIELD}__year__gte": 2025}
        ).delete()
        print(f"Deleted {deleted[0]} existing holiday records from 2025+")

        for start, end, name in ALL_HOLIDAYS:
            if END_FIELD:
                obj = MODEL.objects.create(**{
                    NAME_FIELD: name,
                    START_FIELD: start,
                    END_FIELD: end,
                })
            else:
                # Single date model — create one per day
                for d in date_range(start, end):
                    MODEL.objects.create(**{
                        NAME_FIELD: name,
                        START_FIELD: d,
                    })
            print(f"  [OK] {name}: {start} to {end}")

        print(f"\nTotal holiday records: {MODEL.objects.count()}")
    else:
        print("No model to seed into")
