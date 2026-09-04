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
    LegalDocument, Banner, PartyPackage, PageSection, StatCard, HomePage, AboutPage, PricingPage
)

def seed_gokidsplay_data():
    print("🚀 Starting GoKidsPlay Data Seeding...")

    # 1. Activities
    print("Creating Activities...")
    Activity.objects.all().delete()
    
    activity_data = [
        Activity(
            name="Soft Play",
            slug="soft-play",
            description="Our three tier soft play frame is designed to give your children a safe and fun environment to play and explore.",
            short_description="Safe and fun three tier soft play frame for children to explore.",
            image_url="https://s3-cloud.cr8tive-digital.com/gokidsplay/images/3a35a05c-7e7e-4357-a432-33193e0a4819.jpg", 
            why_choose_us="Three tier Soft Play frame. Toddler play area. Safe and fun family entertainment.",
            what_to_expect="Interactive games and activities in a safe environment.",
        ),
        Activity(
            name="Laser Arena",
            slug="laser-arena",
            description="Experience the thrill of our laser arena! A multi-level interactive space to battle your friends.",
            short_description="Thrilling multi-level interactive laser arena.",
            image_url="https://s3-cloud.cr8tive-digital.com/gokidsplay/images/a2b29616-9845-4b50-a6e9-5a034ff6ad71.jpg", 
            why_choose_us="Interactive gaming experience. Perfect for groups and parties.",
            what_to_expect="Exciting and competitive laser tag action.",
        ),
        Activity(
            name="Go Kart",
            slug="go-kart",
            description="Race your friends on our indoor go kart track! Specially designed for safe but exciting racing.",
            short_description="Indoor go kart track for safe but exciting racing.",
            image_url="https://s3-cloud.cr8tive-digital.com/gokidsplay/images/62636de7-f9d5-4fb7-8f5e-918419f8a3ec.jpeg", 
            why_choose_us="Exciting go kart racing. Safe for kids.",
            what_to_expect="Fun competitive racing on our custom track.",
        ),
        Activity(
            name="Inflatable Park",
            slug="inflatable-park",
            description="Bounce and jump in our massive inflatable park! Fun for the whole family.",
            short_description="Massive inflatable park for endless bouncing fun.",
            image_url="https://s3-cloud.cr8tive-digital.com/gokidsplay/images/aec2aee9-9997-48b4-9b0c-b9a313274cba.jpeg", 
            why_choose_us="Massive bouncy area. Safe and fun.",
            what_to_expect="Endless bouncing and inflatable obstacles.",
        )
    ]
    Activity.objects.bulk_create(activity_data)
    print("✅ Activities seeded.")

    # 2. Pricing Plans & Config
    print("Updating Pricing Configuration...")
    PricingPlan.objects.all().delete()

    config, _ = SessionBookingConfig.objects.get_or_create(id=1)
    config.adult_price = Decimal("12.95")
    config.adult_label = "24 months and above"
    config.adult_description = "£12.95 per person"
    
    config.kid_price = Decimal("7.95")
    config.kid_label = "Under 24 months"
    config.kid_description = "£7.95 per person"

    config.spectator_price = Decimal("4.95")
    config.spectator_label = "Non playing adult"
    config.spectator_description = "£4.95 per person"
    
    config.gst_rate = Decimal("0.00")
    config.save()

    plans = [
        PricingPlan(
            name="24 months and above",
            type="SESSION",
            price=Decimal("12.95"),
            duration=120,
            period_text="/ Person",
            description="Full Play Session",
            features=["2 Hours Session", "Access to Mega Soft Play, Laser Arena, Go Karts, Ninja Inflatable"]
        ),
        PricingPlan(
            name="Under 24 months",
            type="SESSION",
            price=Decimal("7.95"),
            duration=120,
            period_text="/ Person",
            description="Toddler Entry",
            features=["2 Hours Session", "Access to Toddler play area"]
        ),
        PricingPlan(
            name="Under 12 months",
            type="SESSION",
            price=Decimal("1.95"),
            duration=120,
            period_text="/ Person",
            description="Baby Entry",
            features=["2 Hours Session"]
        ),
        PricingPlan(
            name="Non playing adult",
            type="SESSION",
            price=Decimal("4.95"),
            duration=120,
            period_text="/ Person",
            description="Spectator",
            features=["Relax in our lounge area"]
        )
    ]
    PricingPlan.objects.bulk_create(plans)
    print("✅ Pricing updated.")

    # 3. Contact Info
    print("Updating Contact Info...")
    ContactInfo.objects.all().delete()
    
    contacts = [
        ContactInfo(key="phone", label="Call Us", value="07349110865", category="PHONE", link="tel:07349110865"),
        ContactInfo(key="email", label="Email Us", value="info@gokidsplay.co.uk", category="EMAIL", link="mailto:info@gokidsplay.co.uk"),
        ContactInfo(key="address", label="Address", value="310 Kingfield Road, Coventry, CV14LD", category="ADDRESS", link="https://maps.google.com"),
        ContactInfo(key="hours_tue_fri", label="Mon - Tue", value="Closed", category="HOURS"),
        ContactInfo(key="hours_sat", label="Wed - Sun", value="10:00 - 17:30", category="HOURS"),
        ContactInfo(key="hours_sun", label="Bank Holidays", value="10:00 - 17:30", category="HOURS"),
        ContactInfo(key="social_fb", label="Facebook", value="GoKidsPlay", category="SOCIAL", link="https://www.facebook.com/gokidsgoleic"),
        ContactInfo(key="social_ig", label="Instagram", value="@gokidsgoleic", category="SOCIAL", link="https://www.instagram.com/gokidsgoleic/"),
    ]
    ContactInfo.objects.bulk_create(contacts)
    print("✅ Contact Info updated.")

    if Banner.objects.exists():
        Banner.objects.all().delete()

    Banner.objects.create(
        title="Welcome To GoKidsPlay",
        image_url="https://s3-cloud.cr8tive-digital.com/gokidsplay/images/404e6693-9030-4559-bb1d-a0aa81f497f7.jpg",
        link="/session-booking/information",
        active=True
    )
    print("✅ Banner updated.")

    # 4. Pages (HomePage, AboutPage, PricingPage if they exist in cms_homepage etc.)
    # In earlier tests we saw HomePage being imported. We update them directly.
    print("Updating CMS Pages...")
    try:
        home, _ = HomePage.objects.get_or_create(id=1)
        home.hero_title = "Welcome To GoKidsPlay"
        home.hero_subtitle = "An amusement center full of fun childrens activities"
        home.welcome_title = "Who Are We?"
        home.welcome_text = "Go Kids Play is the Coventry's most exciting indoor play and Party Centre. We aim to provide safe and fun family entertainment. We have a range of interactive games and activities such as Laser arena, Go Karts, Three tier Soft Play frame, Bouncy Castle and toddler play area."
        home.save()
        print("✅ HomePage updated.")
    except Exception as e:
        print(f"Skipping HomePage update: {e}")

    try:
        about, _ = AboutPage.objects.get_or_create(id=1)
        about.hero_title = "About Us"
        about.hero_subtitle = "Where Fun Never Stops!"
        about.content = "## Welcome to Go Kids Play\n\nGo Kids Play is the Coventry's most exciting indoor play and Party Centre. We aim to provide safe and fun family entertainment."
        about.save()
        print("✅ AboutPage updated.")
    except Exception as e:
        print(f"Skipping AboutPage update: {e}")
        
    try:
        pricing, _ = PricingPage.objects.get_or_create(id=1)
        pricing.hero_title = "Our Prices"
        pricing.hero_subtitle = "Play session is for 2 hours only"
        pricing.content = "## Go Kids Play Pricing\n\n- **Under 12 months**: £1.95\n- **Under 24 months**: £7.95\n- **24 months and above**: £12.95\n- **Non playing adult**: £4.95\n\n### Payment Notice\n\n**CASH ONLY**\nFree to use CASH MACHINE is available on site.\nBOOK ONLINE TO PAY BY CARD."
        pricing.save()
        print("✅ PricingPage updated.")
    except Exception as e:
        print(f"Skipping PricingPage update: {e}")

    print("✅ GoKidsPlay Data Seeding Complete!")

if __name__ == "__main__":
    seed_gokidsplay_data()
