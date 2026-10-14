"""Fix Logo, GlobalSettings, and Timing Cards in DB"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from django.db import transaction
from django.core.files import File

with transaction.atomic():
    # ─── FIX LOGO ─────────────────────────────────────────────────────────────
    print("=== LOGO ===")
    from apps.core.models import Logo
    # Delete all existing logos
    deleted = Logo.objects.all().delete()
    print(f"  Deleted {deleted[0]} old logos")
    
    # Create new logo with the Go Kids Play-logo.png file
    logo_path = os.path.join(os.path.dirname(__file__), 'media', 'logos', 'Go Kids Play-logo.png')
    if os.path.exists(logo_path):
        logo = Logo(name="Go Kids Play Logo")
        with open(logo_path, 'rb') as f:
            logo.image.save('Go Kids Play-logo.png', File(f), save=True)
        print(f"  [CREATED] Logo: Go Kids Play Logo -> {logo.image.url}")
    else:
        print(f"  [ERROR] Logo file not found at: {logo_path}")

    # ─── FIX GLOBAL SETTINGS ──────────────────────────────────────────────────
    print("\n=== GLOBAL SETTINGS ===")
    from apps.core.models import GlobalSettings
    settings, created = GlobalSettings.objects.get_or_create(pk=1)
    settings.park_name = "Go Kids Play Leicester"
    settings.contact_phone = "07349110865"
    settings.contact_email = "info@gokidsplay.co.uk"
    settings.address = "Ramdoot House, First Floor - 2/3 Navigation Street, Leicester, LE1 3UR"
    settings.map_url = "https://maps.google.com/?q=Spin+Pin+Bowling+Roller+Skating+Arcade+Navigation+Street+Leicester"
    settings.about_text = "Go Kids Play Leicester is Leicester's premier entertainment venue offering roller skating, ten pin bowling, and arcade games all under one roof. Located at Navigation Street in Leicester City Centre, we provide fun for all ages."
    settings.hero_title = "Go Kids Play"
    settings.hero_subtitle = "Roller Skating, Ten Pin Bowling & Arcade Games – All under one roof in Leicester City Centre!"
    settings.opening_hours = {
        "monday": "Closed",
        "tuesday": "12:00 PM – 10:00 PM",
        "wednesday": "12:00 PM – 10:00 PM",
        "thursday": "12:00 PM – 10:00 PM",
        "friday": "12:00 PM – 10:00 PM",
        "saturday": "12:00 PM – 11:00 PM",
        "sunday": "12:00 PM – 10:00 PM",
        "school_holidays": "Open all week (except Monday)"
    }
    settings.adult_price = 9.95
    settings.child_price = 9.95
    settings.save()
    print(f"  [{'CREATED' if created else 'UPDATED'}] GlobalSettings -> Go Kids Play Leicester")

    # ─── FIX TIMING CARDS ─────────────────────────────────────────────────────
    print("\n=== TIMING CARDS ===")
    from apps.cms.models import TimingCard
    TimingCard.objects.all().delete()
    timing_data = [
        {"day_label": "Monday", "open_time": "CLOSED", "close_time": "", "note": "Closed on Mondays", "icon": "Moon", "color": "secondary", "order": 1},
        {"day_label": "Tue – Fri", "open_time": "12:00 PM", "close_time": "10:00 PM", "note": "Open in school holidays", "icon": "Clock", "color": "primary", "order": 2},
        {"day_label": "Saturday", "open_time": "12:00 PM", "close_time": "11:00 PM", "note": "Last entry 10 PM", "icon": "Calendar", "color": "accent", "order": 3},
        {"day_label": "Sunday", "open_time": "12:00 PM", "close_time": "10:00 PM", "note": "Last entry 9 PM", "icon": "Calendar", "color": "primary", "order": 4},
    ]
    for t in timing_data:
        TimingCard.objects.create(**t, active=True)
        print(f"  [CREATED] TimingCard: {t['day_label']} {t['open_time']} - {t['close_time']}")

print("\n✅ Logo, GlobalSettings, and Timing Cards all fixed!")
