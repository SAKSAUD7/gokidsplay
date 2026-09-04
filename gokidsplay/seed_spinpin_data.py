import os
import sys
import django
from decimal import Decimal

# Setup Django environment
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
# Fix Windows stdout encoding
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
django.setup()

from apps.cms.models import (
    Activity, PricingPlan, SessionBookingConfig, ContactInfo, 
    LegalDocument, Banner, PartyPackage, PageSection, StatCard
)

def seed_spinpin_data():
    print("🚀 Starting SpinPin Data Seeding...")

    # 1. Activities
    print("Creating Activities...")
    # Update existing or create new without wiping blindly if possible, but for migration wipe is cleaner
    Activity.objects.all().delete()
    
    activity_data = [
        Activity(
            name="Roller Skating",
            slug="roller-skating",
            description="Roller skating at Spin Pin Leicester is all about movement, energy, and pure fun. Our indoor skating rink is right in the heart of Leicester city centre, providing the perfect place to rollerskate, party, and enjoy time with friends and family.",
            short_description="Experience Leicester's First Roller Skating Rink. Fun for all ages!",
            image_url="/assets/images/roller-skating.jpg", 
            why_choose_us="First Roller Skating Rink in Leicester. Perfect for Parties. Central Location. Family-Friendly Fun.",
            what_to_expect="Spacious indoor skating rink with quality rental skates. Music and lights to boost the fun atmosphere.",
        ),
        Activity(
            name="Ten Pin Bowling",
            slug="ten-pin-bowling",
            description="Bowling at Spin Pin is all about energy, atmosphere, and straight up good times. Our ten pin bowling lanes are located right in the Leicester city centre.",
            short_description="Strike big in our ten pin bowling lanes. Fun for everyone!",
            image_url="/assets/images/bowling.jpg", 
            why_choose_us="Ten Pin Bowling Leicester. Central Location. Perfect for Groups. Kids and Family Friendly.",
            what_to_expect="Fully equipped lanes with automatic scoring. Friendly staff. Food and drink options.",
        ),
        Activity(
            name="Arcade Games",
            slug="arcade-games",
            description="Step into Spin Pin Arcade in Leicester and rediscover the thrill of classic hits, modern gaming, and everything in between.",
            short_description="Level Up at Spin Pin! Classic hits, modern gaming, and VR.",
            image_url="/assets/images/arcade.jpg", 
            why_choose_us="Arcade Leicester. All Ages Welcome. Contactless. Indoor Fun, Rain or Shine.",
            what_to_expect="Dozens of machines including racing, shooters, claw games, air hockey, basketball, and VR Arcade Games.",
        )
    ]
    Activity.objects.bulk_create(activity_data)
    print("✅ Activities seeded.")

    # 2. Pricing Plans & Config
    print("Updating Pricing Configuration...")
    PricingPlan.objects.all().delete()

    # Session Booking Config (Single source of truth for Wizard)
    config, _ = SessionBookingConfig.objects.get_or_create(id=1)
    config.adult_price = Decimal("9.95")
    config.adult_label = "Skating / Bowling / VR"
    config.adult_description = "£9.95 per person / per game"
    
    config.kid_price = Decimal("9.95") # Same price for now based on extracted data
    config.kid_label = "Child (Under 12)"
    config.kid_description = "£9.95 per person"

    config.spectator_price = Decimal("2.95")
    config.spectator_label = "Spectators (Age 4+)"
    config.spectator_description = "£2.95 per person"
    
    config.gst_rate = Decimal("0.00") # UK VAT included usually, or 20%? Assuming included for now
    config.save()

    # Display Plans
    plans = [
        PricingPlan(
            name="Standard Entry",
            type="SESSION",
            price=Decimal("9.95"),
            duration=60,
            period_text="/ Person",
            description="Skating, Bowling, or VR Session",
            features=["60 Minutes Session", "Access to chosen activity"]
        ),
        PricingPlan(
            name="Skate Hire",
            type="SESSION",
            price=Decimal("2.95"),
            duration=60,
            period_text="Each",
            description="Roller Skate Hire",
            features=["Quality Quad Skates"]
        ),
        PricingPlan(
            name="Spectator (4+)",
            type="SESSION",
            price=Decimal("2.95"),
            duration=60,
            period_text="Each",
            description="Non-participating guests",
            features=["Relax in our lounge area"]
        ),
        PricingPlan(
            name="Parking",
            type="SESSION",
            price=Decimal("3.00"),
            duration=0,
            period_text="Per Car",
            description="On-site parking",
            features=["Secure parking space"]
        ),
        PricingPlan(
            name="Locker Hire",
            type="SESSION",
            price=Decimal("2.00"),
            duration=0,
            period_text="Per Locker",
            description="Secure storage",
            features=[]
        )
    ]
    PricingPlan.objects.bulk_create(plans)
    print("✅ Pricing updated.")

    # 3. Contact Info
    print("Updating Contact Info...")
    ContactInfo.objects.all().delete()
    
    contacts = [
        ContactInfo(key="phone", label="Call Us", value="07349 110 865", category="PHONE", link="tel:07349110865"),
        ContactInfo(key="email", label="Email Us", value="info@spinpin.co.uk", category="EMAIL", link="mailto:info@spinpin.co.uk"),
        ContactInfo(key="address", label="Address", value="Ramdoot House, First Floor - 2/3 Navigation Street, Leicester, LE13UR", category="ADDRESS", link="https://maps.google.com"),
        ContactInfo(key="hours_tue_fri", label="Tue - Fri", value="14:00 - 22:00", category="HOURS"),
        ContactInfo(key="hours_sat", label="Saturday", value="12:00 - 23:00", category="HOURS"),
        ContactInfo(key="hours_sun", label="Sunday", value="12:00 - 22:00", category="HOURS"),
        ContactInfo(key="social_fb", label="Facebook", value="Spin Pin Leicester", category="SOCIAL", link="https://www.facebook.com/profile.php?id=61572375597421"),
        ContactInfo(key="social_ig", label="Instagram", value="@spinpinleicester", category="SOCIAL", link="https://www.instagram.com/spinpinleicester"),
    ]
    ContactInfo.objects.bulk_create(contacts)
    print("✅ Contact Info updated.")

    if not Banner.objects.exists():
        Banner.objects.create(
            title="Welcome to Spin Pin",
            image_url="/assets/images/hero_bg.jpg",
            link="/session-booking/information",
            active=True
        )

    print("✅ SpinPin Data Seeding Complete!")

if __name__ == "__main__":
    seed_spinpin_data()
