"""Seed SpinPin party packages and party page sections."""
import os, sys, django
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ninja_backend.settings")

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

django.setup()

from apps.cms.models import PartyPackage, PageSection, PartyBookingConfig

# ─── 1. Party Packages ────────────────────────────────────────────────────────
print("Seeding Party Packages...")
PartyPackage.objects.all().delete()

packages = [
    PartyPackage(
        name="Roller Skating Party",
        description="The perfect birthday party! Skate with your friends on our indoor rink followed by a private party room.",
        price=Decimal("15.00"),
        min_participants=10,
        max_participants=50,
        duration=120,
        includes=[
            "60-min roller skating session",
            "Dedicated party room for 1 hour",
            "Skate hire for all guests",
            "Party host included",
            "Decorations and balloons",
            "2 accompanying adults free",
        ],
        active=True,
        order=1,
        variant="SKATING",
    ),
    PartyPackage(
        name="Bowling Party",
        description="Strike up the fun! Bowl your way through a fantastic birthday party with your crew.",
        price=Decimal("15.00"),
        min_participants=10,
        max_participants=40,
        duration=120,
        includes=[
            "60-min ten pin bowling session",
            "Dedicated party room for 1 hour",
            "Bowling shoe hire included",
            "Party host included",
            "Decorations and balloons",
            "2 accompanying adults free",
        ],
        active=True,
        order=2,
        variant="BOWLING",
    ),
    PartyPackage(
        name="Ultimate Party",
        description="The full Spin Pin experience! Skating AND bowling PLUS arcade tokens for an unforgettable party.",
        price=Decimal("20.00"),
        min_participants=10,
        max_participants=60,
        duration=180,
        includes=[
            "Skating OR Bowling (60 min)",
            "Arcade token pack per child",
            "Dedicated party room for 1 hour",
            "Party host included",
            "Premium decorations",
            "4 accompanying adults free",
            "Priority booking slots",
        ],
        active=True,
        popular=True,
        order=3,
        variant="ULTIMATE",
    ),
]
PartyPackage.objects.bulk_create(packages)
print("Created {} party packages".format(len(packages)))

# ─── 2. Party Page Sections ────────────────────────────────────────────────────
print("Seeding Party PageSections...")
for page_key in ["party-booking", "parties"]:
    hero, created = PageSection.objects.get_or_create(
        page=page_key,
        section_key="hero",
        defaults={
            "title": "Book Your Party at Spin Pin",
            "content": (
                "Celebrate in style at Spin Pin Leicester! "
                "Birthday parties, group events and corporate gatherings. "
                "Roller skating, bowling and arcade fun all under one roof."
            ),
            "active": True,
        },
    )
    if not created:
        hero.title = "Book Your Party at Spin Pin"
        hero.content = (
            "Celebrate in style at Spin Pin Leicester! "
            "Birthday parties, group events and corporate gatherings. "
            "Roller skating, bowling and arcade fun all under one roof."
        )
        hero.active = True
        hero.save()
    status = "created" if created else "updated"
    print("  {} hero for page: {}".format(status, page_key))

# ─── 3. Party Booking Config update ───────────────────────────────────────────
print("Updating PartyBookingConfig...")
try:
    cfg, _ = PartyBookingConfig.objects.get_or_create(id=1)
    cfg.participant_price = Decimal("15.00")
    cfg.spectator_price = Decimal("2.95")
    cfg.free_spectators = 2
    cfg.min_participants = 10
    cfg.deposit_percentage = Decimal("20.00")
    cfg.gst_rate = Decimal("0.00")
    cfg.available_time_slots = [
        "12:00", "13:00", "14:00", "15:00",
        "16:00", "17:00", "18:00", "19:00",
    ]
    cfg.package_inclusions = [
        "60-minute skating or bowling session",
        "Dedicated party room for 1 hour",
        "Party host included",
        "Decorations and balloons",
        "2 accompanying adults free",
    ]
    cfg.duration_label = "60-min session + 60-min party room"
    cfg.active = True
    cfg.save()
    print("PartyBookingConfig updated OK")
except Exception as e:
    print("PartyBookingConfig skipped: {}".format(e))

print("")
print("Party seed complete!")
