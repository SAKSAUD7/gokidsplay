"""
SpinPin Full Site Audit Seed Script
Seeds all missing CMS data found during deep audit:
- FAQs (seeded if empty)
- Timing Cards (opening hours)
- Admin Session Booking times
- Verify all data is SpinPin-correct
"""
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

from apps.cms.models import (
    TimingCard, Faq, SessionBookingConfig, PageSection
)

# ─── 1. Timing Cards (Opening Hours) ──────────────────────────────────────────
print("1. Seeding Timing Cards (Opening Hours)...")
TimingCard.objects.all().delete()

timing_cards = [
    TimingCard(day_label="Mon – Tue", open_time="CLOSED", close_time="", icon="Moon", color="secondary", active=True, order=1),
    TimingCard(day_label="Wednesday", open_time="12:00", close_time="21:00", icon="Clock", color="primary", active=True, order=2),
    TimingCard(day_label="Thursday", open_time="12:00", close_time="21:00", icon="Clock", color="primary", active=True, order=3),
    TimingCard(day_label="Friday", open_time="12:00", close_time="22:00", icon="Clock", color="accent", active=True, order=4),
    TimingCard(day_label="Saturday", open_time="10:00", close_time="22:00", icon="Sun", color="accent", active=True, order=5),
    TimingCard(day_label="Sunday", open_time="10:00", close_time="21:00", icon="Sun", color="secondary", active=True, order=6),
]
TimingCard.objects.bulk_create(timing_cards)
print("   {} timing cards created".format(len(timing_cards)))

# ─── 2. FAQs ──────────────────────────────────────────────────────────────────
print("2. Seeding FAQs...")
if Faq.objects.count() == 0:
    faqs = [
        FAQ(question="What activities are available at Spin Pin?", answer="Spin Pin Leicester offers Roller Skating, Ten Pin Bowling, Arcade Games, and VR Experiences. We also have a Cafe and Party Rooms available.", category="General", active=True, order=1),
        FAQ(question="Do I need to book in advance?", answer="We strongly recommend booking online to guarantee your session. Walk-ins are welcome subject to availability, but busy sessions (weekends, school holidays) fill up fast!", category="Booking", active=True, order=2),
        FAQ(question="What are your opening hours?", answer="We're open Wednesday to Thursday 12:00–21:00, Friday 12:00–22:00, Saturday 10:00–22:00, and Sunday 10:00–21:00. We're closed Monday and Tuesday.", category="General", active=True, order=3),
        FAQ(question="Is there parking available?", answer="Yes, there is parking nearby at the Highcross Shopping Centre car park and NCP car parks within walking distance of Navigation Street.", category="General", active=True, order=4),
        FAQ(question="Do you provide skates?", answer="Yes! Skate hire is included in your roller skating session ticket. We have sizes from children's to adult sizes. Please let us know if you need special assistance.", category="Roller Skating", active=True, order=5),
        FAQ(question="What should I wear for roller skating?", answer="Wear comfortable clothing you can move freely in. We recommend wearing long socks. Avoid skirts or very loose clothing. Helmets and protective gear are available to hire.", category="Roller Skating", active=True, order=6),
        FAQ(question="Is bowling suitable for young children?", answer="Absolutely! We have bumper rails and lightweight bowling balls available for younger players. Bowling shoe hire is included in your ticket.", category="Ten Pin Bowling", active=True, order=7),
        FAQ(question="How do birthday party bookings work?", answer="Our party packages include a dedicated session plus a private party room. You can book online via our Parties page. A 20% deposit secures your date. Minimum 10 guests required.", category="Parties", active=True, order=8),
        FAQ(question="Can we bring our own food and cake?", answer="External food and drinks are not permitted in the arena. We have a licensed cafe with a great food and drink menu. Birthday cakes are welcome for party bookings!", category="Parties", active=True, order=9),
        FAQ(question="What is your cancellation policy?", answer="Session bookings can be cancelled or rescheduled with 48 hours notice for a full refund. Party bookings require 2 weeks notice. Late cancellations may incur a fee.", category="Booking", active=True, order=10),
        FAQ(question="Do I need to sign a waiver?", answer="Yes, all participants must sign a digital waiver before their session. This can be done online in advance or at our kiosk on arrival. Minors require a parent/guardian signature.", category="Safety", active=True, order=11),
        FAQ(question="Is Spin Pin wheelchair accessible?", answer="Yes, Spin Pin is accessible. Our venue has step-free access and accessible facilities. Please contact us in advance if you have specific accessibility requirements so we can prepare.", category="General", active=True, order=12),
        FAQ(question="Are there age or weight restrictions?", answer="Roller skating is suitable for children aged 4+ with an adult present. Bowling is suitable for all ages. Please check our Guidelines page for full safety requirements.", category="Safety", active=True, order=13),
        FAQ(question="Do you offer group discounts?", answer="Yes! We offer special rates for groups of 10 or more. Visit our Groups page or contact us directly for a tailored quote.", category="Booking", active=True, order=14),
        FAQ(question="How do I contact Spin Pin?", answer="You can call us on 07349110865, email info@spinpin.co.uk, or use the contact form on our Contact page. We aim to respond within 24 hours.", category="General", active=True, order=15),
    ]
    Faq.objects.bulk_create(faqs)
    print("   {} FAQs created".format(len(faqs)))
else:
    print("   FAQs already exist ({} found), skipping".format(Faq.objects.count()))

# ─── 3. Session Booking Config Check ──────────────────────────────────────────
print("3. Checking SessionBookingConfig...")
try:
    cfg, _ = SessionBookingConfig.objects.get_or_create(id=1)
    # Update to correct UK GBP pricing
    cfg.active = True
    cfg.available_time_slots = [
        "12:00", "13:00", "14:00", "15:00",
        "16:00", "17:00", "18:00", "19:00", "20:00"
    ]
    cfg.save()
    print("   SessionBookingConfig updated with correct time slots")
except Exception as e:
    print("   SessionBookingConfig skipped: {}".format(e))

# ─── 4. Page Sections for missing pages ────────────────────────────────────────
print("4. Seeding missing PageSections...")

missing_sections = [
    ("faq", "hero", "Frequently Asked Questions", "Got questions? We have answers! Find everything you need to know about visiting Spin Pin Leicester.", True),
    ("about", "hero", "About Spin Pin Leicester", "Discover the story behind Leicester's premier entertainment venue.", True),
    ("contact", "hero", "Get In Touch", "We'd love to hear from you! Contact Spin Pin Leicester for bookings, enquiries, and more.", True),
    ("groups", "hero", "Group Bookings", "Planning a group visit? We offer special rates and packages for schools, corporate events, and large groups.", True),
    ("pricing", "hero", "Pricing & Tickets", "Affordable fun for everyone. Check out our session prices for roller skating, bowling, and more.", True),
    ("guidelines", "hero", "Safety Guidelines", "Your safety is our priority. Please read our guidelines before your visit to Spin Pin Leicester.", True),
    ("attractions", "hero", "Our Attractions", "From roller skating to bowling to arcade games — there's something for everyone at Spin Pin Leicester.", True),
]

for page, key, title, content, active in missing_sections:
    sec, created = PageSection.objects.get_or_create(
        page=page,
        section_key=key,
        defaults={"title": title, "content": content, "active": active}
    )
    if not created:
        sec.title = title
        sec.content = content
        sec.active = active
        sec.save()
    status = "created" if created else "updated"
    print("   {} {}/{} section".format(status, page, key))

print("")
print("Full audit seed complete!")
