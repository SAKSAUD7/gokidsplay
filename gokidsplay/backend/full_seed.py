"""
Full SpinPin database seed — run from backend directory:
  python full_seed.py
"""
import os
import sys
import django
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ninja_backend.settings")

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

django.setup()

from apps.cms.models import (
    SessionBookingConfig, PartyBookingConfig, ContactInfo,
    Activity, Banner, PricingPlan, PageSection, StatCard
)

print("Starting SpinPin full DB seed...")

# 1. Session Booking Config
print("1. Seeding SessionBookingConfig...")
cfg, _ = SessionBookingConfig.objects.get_or_create(id=1)
cfg.adult_price = Decimal("9.95")
cfg.adult_label = "Adult"
cfg.adult_description = "Aged 16+ - per session"
cfg.kid_price = Decimal("9.95")
cfg.kid_label = "Child"
cfg.kid_description = "Aged 3-15 - per session"
cfg.spectator_price = Decimal("2.95")
cfg.spectator_label = "Spectator (4+)"
cfg.spectator_description = "Non-participating guests"
cfg.skate_hire_price = Decimal("2.95")
cfg.shoe_hire_price = Decimal("1.50")
cfg.locker_hire_price = Decimal("2.00")
cfg.token_pack_20_price = Decimal("5.00")
cfg.token_pack_50_price = Decimal("10.00")
cfg.parking_price = Decimal("3.00")
cfg.gst_rate = Decimal("0.00")
cfg.duration_minutes = 60
cfg.duration_label = "60-min Session"
cfg.active = True
cfg.save()
print("   SessionBookingConfig done")

# 2. Party Booking Config
print("2. Seeding PartyBookingConfig...")
try:
    party, _ = PartyBookingConfig.objects.get_or_create(id=1)
    party.participant_price = Decimal("15.00")
    party.participant_label = "Party Guest"
    party.participant_description = "Includes session + party room"
    party.spectator_price = Decimal("0.00")
    party.free_spectators = 2
    party.spectator_label = "Accompanying Adult"
    party.spectator_description = "First 2 adults free"
    party.min_participants = 10
    party.gst_rate = Decimal("0.00")
    party.deposit_percentage = Decimal("20.00")
    party.package_inclusions = [
        "60-minute skating or bowling session",
        "Dedicated party room for 1 hour",
        "Party host",
        "Decorations and balloons"
    ]
    party.available_time_slots = [
        "10:00", "11:00", "12:00", "13:00",
        "14:00", "15:00", "16:00", "17:00", "18:00"
    ]
    party.duration_label = "60-min Session + 60-min Party Room"
    party.active = True
    party.save()
    print("   PartyBookingConfig done")
except Exception as e:
    print("   PartyBookingConfig skipped:", e)

# 3. Contact Info
print("3. Seeding ContactInfo...")
ContactInfo.objects.all().delete()
contacts = [
    ContactInfo(key="phone", label="Call Us", value="07349 110 865", category="PHONE", link="tel:07349110865"),
    ContactInfo(key="email", label="Email Us", value="info@spinpin.co.uk", category="EMAIL", link="mailto:info@spinpin.co.uk"),
    ContactInfo(key="address", label="Address", value="Ramdoot House, First Floor - 2/3 Navigation Street, Leicester, LE1 3UR", category="ADDRESS", link="https://maps.google.com/maps?q=Navigation+Street+Leicester"),
    ContactInfo(key="hours_mon", label="Monday", value="CLOSED", category="HOURS"),
    ContactInfo(key="hours_tue_thu", label="Tue - Thu", value="14:00 - 22:00", category="HOURS"),
    ContactInfo(key="hours_fri", label="Friday", value="12:00 - 22:00", category="HOURS"),
    ContactInfo(key="hours_sat", label="Saturday", value="12:00 - 23:00", category="HOURS"),
    ContactInfo(key="hours_sun", label="Sunday", value="12:00 - 22:00", category="HOURS"),
    ContactInfo(key="social_fb", label="Facebook", value="Spin Pin Leicester", category="SOCIAL", link="https://www.facebook.com/profile.php?id=61572375597421"),
    ContactInfo(key="social_ig", label="Instagram", value="@spinpinleicester", category="SOCIAL", link="https://www.instagram.com/spinpinleicester"),
    ContactInfo(key="social_tt", label="TikTok", value="@spinpinleicester", category="SOCIAL", link="https://www.tiktok.com/@spinpinleicester"),
]
ContactInfo.objects.bulk_create(contacts)
print(f"   {len(contacts)} ContactInfo entries created")

# 4. Activities
print("4. Seeding Activities...")
Activity.objects.all().delete()
activities = [
    Activity(
        name="Roller Skating",
        slug="roller-skating",
        description="Roller skating at Spin Pin Leicester is all about movement, energy, and pure fun. Our indoor skating rink is right in the heart of Leicester city centre, providing the perfect place to rollerskate, party, and enjoy time with friends and family. Whether you are a first-timer or a seasoned skater, our spacious rink caters to all abilities.",
        short_description="Experience Leicester's First Roller Skating Rink. Fun for all ages!",
        active=True,
    ),
    Activity(
        name="Ten Pin Bowling",
        slug="ten-pin-bowling",
        description="Bowling at Spin Pin is all about energy, atmosphere, and straight up good times. Our ten pin bowling lanes are located right in the Leicester city centre. With bumpers available for younger players and an automatic scoring system, it is perfect for competitive fun with friends and family.",
        short_description="Strike it big in our ten pin bowling lanes. Fun for everyone!",
        active=True,
    ),
    Activity(
        name="Arcade Games",
        slug="arcade-games",
        description="Step into Spin Pin Arcade in Leicester and rediscover the thrill of classic hits, modern gaming, and everything in between. From redemption machines to racing simulators, air hockey, basketball, and VR experiences - there is something for everyone. Purchase token packs and win prizes at the redemption counter.",
        short_description="Level Up at Spin Pin! Classic hits, modern gaming, and VR.",
        active=True,
    ),
]
Activity.objects.bulk_create(activities)
print(f"   {len(activities)} Activities created")

# 5. Pricing Plans
print("5. Seeding PricingPlans...")
try:
    PricingPlan.objects.all().delete()
    plans = [
        PricingPlan(name="Standard Entry", type="SESSION", price=Decimal("9.95"), duration=60, period_text="/ Person", description="Skating, Bowling, or VR Session", features=["60 Minutes Session", "Access to chosen activity"], active=True),
        PricingPlan(name="Skate Hire", type="SESSION", price=Decimal("2.95"), duration=60, period_text="Each", description="Roller Skate Hire", features=["Quality Quad Skates"], active=True),
        PricingPlan(name="Spectator (4+)", type="SESSION", price=Decimal("2.95"), duration=60, period_text="Each", description="Non-participating guests", features=["Relax in our lounge area"], active=True),
        PricingPlan(name="Bowling Shoe Hire", type="SESSION", price=Decimal("1.50"), duration=60, period_text="Each", description="Bowling shoe rental", features=["Quality bowling shoes"], active=True),
        PricingPlan(name="Locker Hire", type="SESSION", price=Decimal("2.00"), duration=0, period_text="Per Locker", description="Secure storage", features=["Secure your belongings"], active=True),
        PricingPlan(name="Parking", type="SESSION", price=Decimal("3.00"), duration=0, period_text="Per Car", description="On-site parking", features=["Secure parking space"], active=True),
        PricingPlan(name="Token Pack (20)", type="SESSION", price=Decimal("5.00"), duration=0, period_text="Per Pack", description="20 arcade tokens", features=["20 arcade game tokens"], active=True),
        PricingPlan(name="Token Pack (50)", type="SESSION", price=Decimal("10.00"), duration=0, period_text="Per Pack", description="50 arcade tokens - best value!", features=["50 arcade game tokens", "Best value pack"], active=True),
    ]
    PricingPlan.objects.bulk_create(plans)
    print(f"   {len(plans)} PricingPlans created")
except Exception as e:
    print("   PricingPlans skipped:", e)

# 6. Home Hero PageSection
print("6. Seeding PageSection (home/hero)...")
try:
    hero, created = PageSection.objects.get_or_create(
        page="home",
        section_key="hero",
        defaults={
            "title": "Welcome to Spin Pin",
            "content": "Leicester's ultimate entertainment venue. Roller skating, ten pin bowling, and arcade games all under one roof.",
            "active": True,
        }
    )
    if not created:
        hero.title = "Welcome to Spin Pin"
        hero.content = "Leicester's ultimate entertainment venue. Roller skating, ten pin bowling, and arcade games all under one roof."
        hero.active = True
        hero.save()
    print("   PageSection hero done")
except Exception as e:
    print("   PageSection skipped:", e)

# 7. Home StatCards
print("7. Seeding StatCards...")
try:
    StatCard.objects.filter(page="home").delete()
    stats = [
        StatCard(page="home", value="3+", label="Activities", icon="Zap", active=True, order=1),
        StatCard(page="home", value="5,000+", label="Happy Visitors", icon="Users", active=True, order=2),
        StatCard(page="home", value="100%", label="Safe & Fun", icon="Shield", active=True, order=3),
        StatCard(page="home", value="Leicester", label="City Centre", icon="Trophy", active=True, order=4),
    ]
    StatCard.objects.bulk_create(stats)
    print(f"   {len(stats)} StatCards created")
except Exception as e:
    print("   StatCards skipped:", e)

print("")
print("SpinPin DB seed complete!")
print("Admin: http://localhost:9000/django-admin/")
