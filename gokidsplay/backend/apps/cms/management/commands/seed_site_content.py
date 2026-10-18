"""
Seed the CMS collections with the content the public site currently shows as
built-in fallbacks, so every item is visible and editable in the admin portal.

Safe to re-run: each collection is only seeded when it is empty, so nothing an
admin has added or edited is ever overwritten.

    python manage.py seed_site_content
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.cms.models import Faq, FacilityItem, GalleryItem, SocialLink, StatCard, TimelineItem
from apps.core.models import GlobalSettings

FAQS = [
    ("Do I need to book in advance?",
     "While walk-ins are welcome subject to availability, we strongly recommend booking online in advance, especially for weekends and school holidays, to guarantee your spot."),
    ("Are grip socks required?",
     "Yes, special grip socks are required for the Inflatable Park and Soft Play areas for hygiene and safety reasons. You can purchase these at reception."),
    ("What age range is Go Kids Play suitable for?",
     "We have activities for all ages! Soft Play is great for toddlers and younger children, Go Karts for ages 4-12, and Laser Arena for ages 7 and up."),
    ("Can I bring my own food and drink?",
     "Only food and drink purchased at our on-site café may be consumed on the premises. We do not allow outside food, except for birthday cakes for booked parties."),
    ("Is there parking available?",
     "Yes, we have on-site parking available. Please note parking is limited to a maximum of 3 hours, and you must register your car at reception."),
    ("Do you offer Halal or Vegetarian food?",
     "Yes! Our café and party menus include both Vegetarian and Halal options. Please inform us of any specific dietary requirements when booking."),
]

TIMELINE = [
    ("2022", "The Vision", "Conceptualised Coventry's premier indoor play centre — Soft Play, Laser Arena, Go Karts & Inflatables all under one roof"),
    ("2023", "Building Begins", "Fitted out our Kingfield Road venue with state-of-the-art activities and a dedicated party centre"),
    ("2024", "Grand Opening", "Opened our doors to thousands of excited visitors — Go Kids Play Coventry was born!"),
    ("2025", "Growing Strong", "Expanded activities, launched party packages, and became Coventry's favourite family play centre"),
]

ABOUT_STATS = [
    ("Epic Activities", "4", "Zap"),
    ("Happy Visitors", "5,000+", "Users"),
    ("Safe & Fun", "100%", "Shield"),
    ("Reviews", "5⭐", "Trophy"),
]

GALLERY = [
    ("/images/gokidsplay/soft-play-wave-slide.jpg", "Giant Wave Slide", "soft_play"),
    ("/images/gokidsplay/inflatable-obstacle-course.jpg", "Inflatable Obstacle Course", "inflatable"),
    ("/images/gokidsplay/go-kart-track.jpg", "Go Kart Track", "go_karts"),
    ("/images/gokidsplay/soft-play-overview.jpg", "Soft Play Area", "soft_play"),
    ("/images/gokidsplay/inflatable-bounce-zone.jpg", "Inflatable Bounce Zone", "inflatable"),
    ("/images/gokidsplay/sports-pitch.jpg", "Sports Pitch", "general"),
    ("/images/gokidsplay/soft-play-frame.jpg", "Soft Play Frame", "soft_play"),
    ("/images/gokidsplay/toddler-play-frame.jpg", "Toddler Play Frame", "soft_play"),
    ("/images/gokidsplay/toddler-truck-ride.jpg", "Toddler Truck Ride", "soft_play"),
    ("/images/gokidsplay/arcade-rides.jpg", "Arcade & Kiddie Rides", "general"),
    ("/images/gokidsplay/arcade-air-hockey.jpg", "Air Hockey & Games", "general"),
    ("/images/gokidsplay/cafe-and-inflatables.jpg", "Café & Party Seating", "parties"),
    ("/images/gokidsplay/cafe-seating.jpg", "Café", "general"),
    ("/images/gokidsplay/entrance-reception.jpg", "Welcome Desk", "general"),
]

FACILITIES = [
    ("On-Site Café", "Coffee",
     "Relax in our spacious café offering a range of hot and cold drinks, fresh sandwiches, pizzas, and snacks. The perfect spot for parents to unwind while the kids play."),
    ("Free Wi-Fi", "Wifi",
     "Stay connected throughout your visit. We offer fast, complimentary Wi-Fi across all seating and café areas."),
    ("Customer Parking", "Car",
     "On-site parking available for all customers. Please register your vehicle at reception on arrival. Maximum stay: 3 hours."),
    ("Baby Changing", "Baby",
     "Fully equipped baby changing facilities in our restrooms, ensuring comfort for families with infants throughout their visit."),
    ("Party Rooms", "PartyPopper",
     "Dedicated private party rooms for birthday celebrations, complete with vibrant décor, catering, and a dedicated party host."),
    ("Secure Entry", "ShieldCheck",
     "Your child's safety is our priority. Our secure entry & exit system ensures children cannot leave unaccompanied at any time."),
]

SOCIAL_LINKS = [
    ("Instagram", "https://www.instagram.com/gokidsplay/", "Instagram"),
    ("Facebook", "https://www.facebook.com/gokidsplay", "Facebook"),
]


class Command(BaseCommand):
    help = "Seed empty CMS collections with the site's current built-in content (never overwrites existing data)."

    def _seed(self, label, model, rows, build, filter_kwargs=None):
        qs = model.objects.filter(**(filter_kwargs or {}))
        if qs.exists():
            self.stdout.write(f"  - {label}: already has {qs.count()} item(s), skipped")
            return
        for order, row in enumerate(rows):
            build(order, row).save()
        self.stdout.write(self.style.SUCCESS(f"  + {label}: added {len(rows)}"))

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding CMS content…")

        self._seed("FAQs", Faq, FAQS,
                   lambda i, r: Faq(question=r[0], answer=r[1], order=i, active=True))
        self._seed("Timeline", TimelineItem, TIMELINE,
                   lambda i, r: TimelineItem(year=r[0], title=r[1], description=r[2], order=i, active=True))
        self._seed("About page stat cards", StatCard, ABOUT_STATS,
                   lambda i, r: StatCard(label=r[0], value=r[1], unit=r[0], icon=r[2], page="about", order=i, active=True),
                   {"page": "about"})
        self._seed("Gallery", GalleryItem, GALLERY,
                   lambda i, r: GalleryItem(image_url=r[0], title=r[1], category=r[2], order=i, active=True))
        self._seed("Facilities", FacilityItem, FACILITIES,
                   lambda i, r: FacilityItem(title=r[0], icon=r[1], description=r[2], items=[], order=i, active=True))
        self._seed("Social links", SocialLink, SOCIAL_LINKS,
                   lambda i, r: SocialLink(platform=r[0], url=r[1], icon=r[2], order=i, active=True))

        if GlobalSettings.objects.exists():
            self.stdout.write("  - Site settings: already set, skipped")
        else:
            GlobalSettings.objects.create(
                park_name="Go Kids Play",
                contact_phone="07349110865",
                contact_email="info@gokidsplay.co.uk",
                address="310 Kingfield Road, Coventry, CV1 4LD",
                map_url="https://maps.google.com/?q=310+Kingfield+Road,+Coventry,+CV1+4LD",
                party_availability="Wednesday - Sunday",
            )
            self.stdout.write(self.style.SUCCESS("  + Site settings: created with Go Kids Play Coventry details"))

        self.stdout.write(self.style.SUCCESS("Done."))
