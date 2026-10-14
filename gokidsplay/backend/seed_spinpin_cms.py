"""
Go Kids Play CMS seed script - updates pages, config, FAQs, stat cards, socials.
Run: python seed_gokidsplay_cms.py  (from backend/ folder with venv active)
"""
import os, sys, django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ninja_backend.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.cms.models import (
    Page, SessionBookingConfig, StatCard, Faq, SocialLink,
)

# ------------------------------------------------------------------
# 1. Fix Page titles (remove Ninja Inflatable Park branding)
# ------------------------------------------------------------------
PAGE_TITLES = {
    "home":        "Go Kids Play - Leicester's Premier Entertainment Venue",
    "about":       "About Us - Go Kids Play Leicester",
    "pricing":     "Pricing - Go Kids Play Leicester",
    "parties":     "Parties and Events - Go Kids Play Leicester",
    "attractions": "Attractions - Go Kids Play Leicester",
    "contact":     "Contact Us - Go Kids Play Leicester",
    "groups":      "Group Bookings - Go Kids Play Leicester",
    "guidelines":  "Safety Guidelines - Go Kids Play Leicester",
}

print("=== Updating Page titles ===")
for slug, title in PAGE_TITLES.items():
    page, created = Page.objects.update_or_create(
        slug=slug,
        defaults={
            "title": title,
            "meta_title": title,
            "meta_description": f"Book your experience at Go Kids Play - {slug.replace('-',' ').title()}",
            "active": True,
        }
    )
    action = "CREATED" if created else "UPDATED"
    print(f"  [{action}] /{slug} -> {title}")

# ------------------------------------------------------------------
# 2. Update SessionBookingConfig with correct GBP prices
# ------------------------------------------------------------------
print("\n=== Updating SessionBookingConfig ===")
config, created = SessionBookingConfig.objects.get_or_create(id=1)
config.adult_price           = 9.95
config.adult_label           = "Adults & Kids 7+ Years"
config.adult_description     = "9.95 GBP per person per session"
config.kid_price             = 9.95
config.kid_label             = "Young Kids (1-6 Years)"
config.kid_description       = "9.95 GBP per person per session"
config.spectator_price       = 2.95
config.spectator_label       = "Spectators (Age 4+)"
config.spectator_description = "2.95 GBP per person"
config.gst_rate              = 0.00   # No VAT on UK leisure activities
config.duration_label        = "60 Minutes"
config.duration_description  = "Standard session"
# Add-on prices
config.skate_hire_price      = 2.95
config.shoe_hire_price       = 1.50
config.locker_hire_price     = 2.00
config.token_pack_20_price   = 5.00
config.token_pack_50_price   = 10.00
config.parking_price         = 3.00
config.active                = True
config.save()
print(f"  [{'CREATED' if created else 'UPDATED'}] SessionBookingConfig id=1")
print(f"  adult=GBP{config.adult_price}  kid=GBP{config.kid_price}  spec=GBP{config.spectator_price}")
print(f"  skate=GBP{config.skate_hire_price}  shoe=GBP{config.shoe_hire_price}  locker=GBP{config.locker_hire_price}")
print(f"  tokens20=GBP{config.token_pack_20_price}  tokens50=GBP{config.token_pack_50_price}  parking=GBP{config.parking_price}")

# ------------------------------------------------------------------
# 3. Seed FAQs
# ------------------------------------------------------------------
print("\n=== Seeding FAQs ===")
FAQS = [
    ("What activities are available?",
     "Go Kids Play Leicester offers roller skating, ten-pin bowling, and an arcade with VR experiences. All under one roof in Leicester city centre."),
    ("What are your opening hours?",
     "We are open Tuesday-Friday 2pm-10pm, Saturday 12pm-11pm, Sunday 12pm-10pm. We are closed on Mondays."),
    ("Do I need to book in advance?",
     "We recommend booking online to guarantee your slot, especially on weekends. Walk-ins are welcome subject to availability."),
    ("What is the minimum age for roller skating?",
     "Roller skating is available for all ages. Children under 7 must be supervised by an adult at all times."),
    ("Do you hire skates?",
     "Yes! Skate hire is available for GBP 2.95 per pair. We stock a full range of sizes including children's sizes."),
    ("Is parking available?",
     "Yes, we have a secure car park close to the entrance at GBP 3.00 per car. Pay at reception on arrival."),
    ("Do you offer locker hire?",
     "Yes, secure lockers are available to hire for GBP 2.00. Various sizes are available at the venue."),
    ("Can I host a birthday party at Go Kids Play?",
     "Absolutely! We offer fantastic party packages. Contact us to discuss your requirements."),
    ("Is food available at the venue?",
     "Yes! We have a food and drinks area where you can grab refreshments during your visit."),
    ("What is your cancellation policy?",
     "Bookings can be cancelled or rescheduled up to 24 hours before your session. Please contact us directly to make changes."),
]

Faq.objects.all().delete()
for i, (q, a) in enumerate(FAQS):
    Faq.objects.create(question=q, answer=a, order=i, active=True)
print(f"  Seeded {len(FAQS)} FAQs")

# ------------------------------------------------------------------
# 4. Seed Stat Cards
# ------------------------------------------------------------------
print("\n=== Seeding Stat Cards ===")
STATS = [
    ("3 Activities",     "Skating, Bowling & Arcade"),
    ("5-Star Rated",     "Loved by Leicester families"),
    ("10,000+ Visitors", "And counting!"),
    ("City Centre",      "Easy to find, easy to reach"),
]
StatCard.objects.all().delete()
for i, (value, label) in enumerate(STATS):
    StatCard.objects.create(value=value, label=label, order=i, active=True)
print(f"  Seeded {len(STATS)} stat cards")

# ------------------------------------------------------------------
# 5. Social Links
# ------------------------------------------------------------------
print("\n=== Seeding Social Links ===")
SOCIALS = [
    ("Instagram",  "instagram", "https://instagram.com/gokidsplayleicester"),
    ("Facebook",   "facebook",  "https://facebook.com/gokidsplayleicester"),
    ("TikTok",     "tiktok",    "https://tiktok.com/@gokidsplayleicester"),
    ("X",          "twitter",   "https://twitter.com/gokidsplayleicester"),
]
for name, platform, url in SOCIALS:
    SocialLink.objects.update_or_create(
        platform=platform,
        defaults={"name": name, "url": url, "active": True}
    )
print(f"  Seeded {len(SOCIALS)} social links")

print("\nAll done! CMS seeded with Go Kids Play branding and correct pricing.")
