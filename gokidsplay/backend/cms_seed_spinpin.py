"""
Go Kids Play CMS Full Content Seed Script
Updates all CMS pages, sections, activities, FAQs, stats, social links,
party packages, group packages, guidelines, contact info, and timing cards.
Run: python cms_seed_gokidsplay.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from django.db import transaction
from apps.cms.models import (
    Page, PageSection, Activity, Faq, StatCard, SocialLink,
    GalleryItem, PartyPackage, GroupPackage, GuidelineCategory,
    ContactInfo, MenuSection, TimingCard
)

def upsert(model, filter_kwargs, update_kwargs):
    obj, created = model.objects.get_or_create(**filter_kwargs, defaults=update_kwargs)
    if not created:
        for k, v in update_kwargs.items():
            setattr(obj, k, v)
        obj.save()
    status = "CREATED" if created else "UPDATED"
    print(f"  [{status}] {model.__name__}: {list(filter_kwargs.values())[0]}")
    return obj

with transaction.atomic():

    # ─── PAGES ───────────────────────────────────────────────────────────────
    print("\n=== PAGES ===")
    pages = [
        {"slug": "home",        "title": "Go Kids Play – Leicester's Premier Entertainment Venue",
         "description": "Roller Skating, Ten Pin Bowling, Arcade Games and more at Go Kids Play Leicester. Book your session today!",
         "keywords": "bowling leicester, roller skating leicester, arcade leicester, Go Kids Play, entertainment venue leicester"},
        {"slug": "about",       "title": "About Go Kids Play – Leicester City Centre Entertainment",
         "description": "Learn about Go Kids Play, Leicester's premier entertainment venue on Navigation Street.",
         "keywords": "about Go Kids Play, bowling venue leicester, roller skating venue"},
        {"slug": "attractions", "title": "Attractions – Go Kids Play Leicester",
         "description": "Explore our activities: Roller Skating, Ten Pin Bowling, Arcade Games, VR and more.",
         "keywords": "roller skating leicester, bowling leicester, arcade leicester, VR leicester"},
        {"slug": "pricing",     "title": "Pricing – Go Kids Play Leicester",
         "description": "Affordable fun for all ages. View our session prices, add-ons, and group rates.",
         "keywords": "Go Kids Play prices, bowling prices leicester, roller skating prices leicester"},
        {"slug": "parties",     "title": "Party Packages – Go Kids Play Leicester",
         "description": "Celebrate your birthday or event at Go Kids Play Leicester. Book a party package today.",
         "keywords": "birthday party leicester, party venue leicester, functions Go Kids Play"},
        {"slug": "groups",      "title": "Group Bookings – Go Kids Play Leicester",
         "description": "Group and school bookings available at Go Kids Play Leicester. Discounted rates for 10+ people.",
         "keywords": "group booking leicester, school trip leicester, corporate event leicester"},
        {"slug": "contact",     "title": "Contact Go Kids Play – Leicester",
         "description": "Get in touch with Go Kids Play Leicester. Find our address, phone, and opening hours.",
         "keywords": "Go Kids Play contact, Go Kids Play phone number, Go Kids Play address, navigation street leicester"},
        {"slug": "guidelines",  "title": "Safety Guidelines – Go Kids Play Leicester",
         "description": "Read our safety guidelines before your visit to Go Kids Play Leicester.",
         "keywords": "Go Kids Play safety, bowling rules, roller skating rules leicester"},
    ]
    for p in pages:
        slug = p.pop("slug")
        upsert(Page, {"slug": slug}, {**p, "slug": slug, "active": True})

    # ─── PAGE SECTIONS ────────────────────────────────────────────────────────
    print("\n=== PAGE SECTIONS ===")
    sections = [
        # HOME
        {"page": "home", "section_key": "hero", "order": 1,
         "title": "Leicester's Ultimate Entertainment Destination",
         "subtitle": "Roll, Bowl & Play at Go Kids Play – Three Activities, One Epic Venue in Leicester City Centre!",
         "content": "Roller skating, ten pin bowling, and arcade games all under one roof. Suitable for all ages. Walk-ins welcome!",
         "cta_text": "Book Tickets Now", "cta_link": "/book",
         "image_url": "/images/uploads/img-1.jpg"},
        {"page": "home", "section_key": "about", "order": 2,
         "title": "Leicester's Premier Entertainment Venue",
         "subtitle": "Three amazing activities under one roof",
         "content": "Go Kids Play is Leicester's go-to destination for roller skating, ten pin bowling, and arcade games. Conveniently located on Navigation Street in Leicester City Centre, we offer fun for the whole family. With 8+ bowling lanes, a full roller skating rink, and over 100 arcade machines, there's always something exciting waiting for you. Walk-ins are welcome – just show up and start playing!",
         "cta_text": "View Activities", "cta_link": "/attractions"},
        {"page": "home", "section_key": "contact", "order": 10,
         "title": "Find Us", "subtitle": "Navigation Street, Leicester City Centre",
         "content": "We're easy to find – right in Leicester City Centre on Navigation Street. Excellent transport links and parking nearby.",
         "cta_text": "Get Directions", "cta_link": "https://maps.google.com/?q=Spin+Pin+Bowling+Roller+Skating+Arcade+Navigation+Street+Leicester"},

        # ABOUT
        {"page": "about", "section_key": "hero", "order": 1,
         "title": "About Go Kids Play Leicester",
         "subtitle": "We're on a mission to bring fun, family, and friends together in Leicester's greatest entertainment venue.",
         "image_url": "/images/uploads/img-7.jpg"},
        {"page": "about", "section_key": "story", "order": 2,
         "title": "Our Story",
         "content": "<p>Go Kids Play Leicester was born from a simple idea: create a space where people of all ages can enjoy roller skating, bowling, and arcade games together – all under one roof, right in the heart of Leicester City Centre.</p><p>We opened our doors on Navigation Street and quickly became the city's favourite venue for family outings, birthday parties, date nights, school trips, and corporate events. We combine the nostalgia of roller skating with the thrill of ten pin bowling and the excitement of over 100 arcade machines.</p><p>Whether you're a seasoned bowler, an experienced skater, or a complete beginner, Go Kids Play welcomes you. Our friendly staff are always on hand to help, and our facilities are designed with safety, comfort, and fun in mind.</p>",
         "image_url": "/images/uploads/img-3.jpg"},

        # PARTIES
        {"page": "parties", "section_key": "hero", "order": 1,
         "title": "Party with Go Kids Play Leicester",
         "subtitle": "Birthdays, celebrations, school trips and corporate events – we make every occasion unforgettable.",
         "image_url": "/images/uploads/img-5.jpg",
         "cta_text": "Book a Party", "cta_link": "/party-booking"},
        {"page": "parties", "section_key": "form", "order": 3,
         "title": "Book Your Party",
         "subtitle": "Fill in the form and we'll get in touch to confirm your booking within 24 hours."},

        # ATTRACTIONS
        {"page": "attractions", "section_key": "hero", "order": 1,
         "title": "Our Activities",
         "subtitle": "Roller Skating, Ten Pin Bowling & Arcade Games – Something for everyone at Go Kids Play Leicester City Centre.",
         "image_url": "/images/uploads/img-2.jpg"},

        # PRICING
        {"page": "pricing", "section_key": "hero", "order": 1,
         "title": "Simple, Transparent Pricing",
         "subtitle": "Affordable fun for everyone. No hidden fees. Walk-ins always welcome!",
         "image_url": "/images/uploads/img-6.jpg"},

        # GROUPS
        {"page": "groups", "section_key": "hero", "order": 1,
         "title": "Group Bookings at Go Kids Play",
         "subtitle": "Schools, colleges, corporates – we love hosting groups! Discounted rates for 10+ people.",
         "image_url": "/images/uploads/img-8.jpg",
         "cta_text": "Enquire Now", "cta_link": "/contact"},

        # CONTACT
        {"page": "contact", "section_key": "hero", "order": 1,
         "title": "Get in Touch",
         "subtitle": "We'd love to hear from you. Reach us by phone, email or come visit us at Navigation Street.",
         "image_url": "/images/uploads/img-4.jpg"},
        {"page": "contact", "section_key": "form", "order": 2,
         "title": "Send us a Message",
         "subtitle": "Fill in the form below and we'll respond within 24 hours."},

        # GUIDELINES
        {"page": "guidelines", "section_key": "hero", "order": 1,
         "title": "Safety & Visit Guidelines",
         "subtitle": "Your safety is our top priority. Please read these guidelines before your visit to Go Kids Play Leicester.",
         "image_url": "/images/uploads/img-7.jpg"},

        # FAQ
        {"page": "faq", "section_key": "hero", "order": 1,
         "title": "Frequently Asked Questions",
         "subtitle": "Got questions? We've got answers! Find everything you need to know about visiting Go Kids Play Leicester.",
         "image_url": "/images/uploads/img-7.jpg"},
    ]
    for s in sections:
        page = s.pop("page")
        skey = s.pop("section_key")
        upsert(PageSection, {"page": page, "section_key": skey}, {**s, "page": page, "section_key": skey, "active": True})

    # ─── ACTIVITIES ───────────────────────────────────────────────────────────
    print("\n=== ACTIVITIES ===")
    activities = [
        {"name": "Roller Skating", "slug": "roller-skating", "order": 1,
         "short_description": "Glide around Leicester's premier indoor skating rink. Suitable for all ages and skill levels.",
         "description": "Experience the thrill of roller skating on our smooth, high-quality skating surface. Whether you're a first-timer or a seasoned skater, our rink is perfect for everyone. Skate hire is available (£2.95/pair) or bring your own! Safety equipment is provided and our trained staff are always on hand to help beginners.",
         "image_url": "/images/uploads/img-2.jpg",
         "why_choose_us": "Leicester's oldest indoor roller rink. Professional-grade surface. All ages welcome. Safety kit available.",
         "what_to_expect": "Check in at reception, hire skates or use your own, hit the rink! Staff assist beginners especially during quieter sessions.",
         "location_info": "Navigation Street, Leicester City Centre. LE1 6JS. Free parking available nearby.",
         "gallery": ["/images/uploads/img-1.jpg", "/images/uploads/img-3.jpg"],
         "activity_faqs": [
             {"question": "Do I need to book in advance?", "answer": "Walk-ins are welcome! However booking online guarantees your slot, especially at weekends."},
             {"question": "How much is skate hire?", "answer": "Skate hire is £2.95 per pair. We have sizes from toddler to adult."},
             {"question": "Is there an age minimum?", "answer": "No minimum age. Under 7s must be accompanied by an adult on the rink."},
         ]},
        {"name": "Ten Pin Bowling", "slug": "ten-pin-bowling", "order": 2,
         "short_description": "Full-size pro bowling lanes with bumpers available. Perfect for all skill levels.",
         "description": "Knock 'em down at Go Kids Play's full-size ten pin bowling lanes. With 8+ professional-grade lanes, auto-scoring, and bumpers available for younger players, it's the perfect activity for families, friends, and friendly competition. Bowling shoes are included in the session price.",
         "image_url": "/images/uploads/img-4.jpg",
         "why_choose_us": "Full-size pro lanes. Bumpers for kids. Auto-scoring system. Shoe hire included. Great for competitive play.",
         "what_to_expect": "Book your lane, collect your shoes, and let the competition begin! Scores are automatically tracked on our screen systems.",
         "location_info": "Navigation Street, Leicester City Centre. LE1 6JS.",
         "gallery": ["/images/uploads/img-5.jpg", "/images/uploads/img-7.jpg"],
         "activity_faqs": [
             {"question": "Can young children play?", "answer": "Yes! We have bumpers available and ramps for very young players."},
             {"question": "Is shoe hire included?", "answer": "Bowling shoe hire (£1.50) is separate. Bring your own bowling shoes if you have them."},
             {"question": "How many people per lane?", "answer": "We recommend up to 6 people per lane for a great experience."},
         ]},
        {"name": "Arcade Games", "slug": "arcade-games", "order": 3,
         "short_description": "100+ machines including VR, redemption games, air hockey, and prize counters.",
         "description": "Step into our epic arcade featuring over 100 machines! From classic hits to modern VR experiences, air hockey, basketball shooters, claw machines, and redemption games where you can win prize tickets. The arcade is pay-as-you-go with token packs available at reception. All ages are welcome!",
         "image_url": "/images/uploads/img-6.jpg",
         "why_choose_us": "100+ machines. VR experiences. Prize redemption counter. Token packs available. No time limit on tokens.",
         "what_to_expect": "Purchase token packs at reception, then explore our huge arcade. Win tickets on redemption games and exchange them for prizes at the prize counter!",
         "location_info": "Navigation Street, Leicester City Centre. LE1 6JS.",
         "gallery": ["/images/uploads/img-8.jpg", "/images/uploads/img-2.jpg"],
         "activity_faqs": [
             {"question": "How do I pay for arcade games?", "answer": "Purchase token packs at reception. Tokens work on all machines. No time limit!"},
             {"question": "Can toddlers use the arcade?", "answer": "Yes, many machines are suitable for young children with adult supervision."},
             {"question": "Can I exchange prize tickets?", "answer": "Absolutely! Visit our prize counter and exchange your tickets for great prizes."},
         ]},
    ]
    for a in activities:
        slug = a.pop("slug")
        upsert(Activity, {"slug": slug}, {**a, "slug": slug, "active": True})

    # ─── STAT CARDS ───────────────────────────────────────────────────────────
    print("\n=== STAT CARDS ===")
    StatCard.objects.all().delete()
    stats = [
        {"label": "Activities", "value": "3", "unit": "Fun Activities", "icon": "Zap", "color": "primary", "page": "home", "order": 1},
        {"label": "Visitors", "value": "50K+", "unit": "Happy Visitors", "icon": "Users", "color": "secondary", "page": "home", "order": 2},
        {"label": "Rating", "value": "5★", "unit": "Star Rated", "icon": "Trophy", "color": "accent", "page": "home", "order": 3},
        {"label": "Location", "value": "City", "unit": "Centre Leicester", "icon": "MapPin", "color": "primary", "page": "home", "order": 4},
        {"label": "Activities", "value": "3", "unit": "World-Class Activities", "icon": "Zap", "color": "primary", "page": "about", "order": 1},
        {"label": "Arcade", "value": "100+", "unit": "Arcade Machines", "icon": "Star", "color": "secondary", "page": "about", "order": 2},
        {"label": "Lanes", "value": "8+", "unit": "Bowling Lanes", "icon": "Target", "color": "accent", "page": "about", "order": 3},
        {"label": "Experience", "value": "2020", "unit": "Est. Leicester", "icon": "Calendar", "color": "primary", "page": "about", "order": 4},
    ]
    for s in stats:
        StatCard.objects.create(**s, active=True)
        print(f"  [CREATED] StatCard: {s['value']} {s['unit']} ({s['page']})")

    # ─── FAQs ─────────────────────────────────────────────────────────────────
    print("\n=== FAQs ===")
    Faq.objects.all().delete()
    faqs = [
        # General
        {"question": "Where is Go Kids Play located?", "answer": "We're at Navigation Street, Leicester City Centre, LE1 6JS. Very easy to reach by public transport or car.", "category": "General", "order": 1},
        {"question": "What are your opening hours?", "answer": "Monday: Closed | Tuesday-Friday (Term Time): 2:00 PM – 9:00 PM | Tuesday-Friday (School Holidays): 10:00 AM – 8:00 PM | Saturday: 12:00 PM – 9:00 PM | Sunday: 12:00 PM – 8:00 PM. Last entry is 1 hour before closing.", "category": "General", "order": 2},
        {"question": "Do I need to book in advance?", "answer": "Walk-ins are always welcome! However, we strongly recommend booking online for weekends and school holidays to guarantee your spot. Group bookings (10+) must be pre-booked.", "category": "General", "order": 3},
        {"question": "Is there parking available?", "answer": "Nearby car parks are available close to Navigation Street. We also offer parking registration at reception for £3.00 per car.", "category": "General", "order": 4},
        {"question": "Is Go Kids Play suitable for all ages?", "answer": "Absolutely! We cater for all ages from toddlers to adults. We have specific sessions and equipment to suit different age groups.", "category": "General", "order": 5},
        # Pricing
        {"question": "How much does it cost?", "answer": "Roller Skating, Bowling & VR: £9.95 per person/game. Roller Skate Hire: £2.95/pair. Spectators (Age 4+): £2.95. Spectators under 4: FREE. Parking: £3.00/car. Lockers: £2.00.", "category": "Pricing", "order": 1},
        {"question": "Are there any discounts for groups?", "answer": "Yes! Groups of 10+ people qualify for discounted rates. Please get in touch via our contact page or call us for a custom quote.", "category": "Pricing", "order": 2},
        {"question": "Do you accept card payments?", "answer": "Yes, we accept all major credit and debit cards. We also welcome cash payments. Contactless payments are available at all tills.", "category": "Pricing", "order": 3},
        # Roller Skating
        {"question": "Do I need to bring my own skates?", "answer": "No! We have quad skates available to hire (£2.95/pair) in all sizes from children to adults. You're also welcome to bring your own!", "category": "Roller Skating", "order": 1},
        {"question": "Can complete beginners skate?", "answer": "Absolutely! Our staff are friendly and always ready to help beginners get their skating legs. We also have skating aids available.", "category": "Roller Skating", "order": 2},
        {"question": "What safety equipment is available?", "answer": "Helmets, knee pads and wrist guards are available for hire or use at the venue. We strongly recommend protective equipment for younger skaters.", "category": "Roller Skating", "order": 3},
        # Bowling
        {"question": "How long is a bowling session?", "answer": "A standard session is one game (approximately 30-45 minutes for up to 6 players). You can book multiple games back to back.", "category": "Bowling", "order": 1},
        {"question": "Is shoe hire included?", "answer": "Bowling shoes are available to hire for £1.50. If you have your own bowling shoes, you're welcome to bring them.", "category": "Bowling", "order": 2},
        {"question": "Do you have bumpers for children?", "answer": "Yes! Bumpers and ball ramps are available for younger players to make bowling more enjoyable.", "category": "Bowling", "order": 3},
        # Parties
        {"question": "Can I book a birthday party at Go Kids Play?", "answer": "Yes! We love hosting birthday parties and special celebrations. Visit our Parties page or call us to discuss packages. We offer tailored party experiences including all activities, food options, and a private party area.", "category": "Parties", "order": 1},
        {"question": "What's included in a party package?", "answer": "Party packages typically include session time for your chosen activities, a private party room, food from our menu, and a dedicated party host. Contact us for the latest inclusions and pricing.", "category": "Parties", "order": 2},
        {"question": "How far in advance should I book a party?", "answer": "We recommend booking at least 2-4 weeks in advance, especially for weekends. For larger parties, 6+ weeks is ideal to secure your preferred date and time.", "category": "Parties", "order": 3},
        # Accessibility
        {"question": "Is Go Kids Play wheelchair accessible?", "answer": "Yes, our venue has ramp access and accessible facilities. Please call us in advance so we can make appropriate arrangements for your visit.", "category": "Accessibility", "order": 1},
        {"question": "Are lockers available?", "answer": "Yes! Lockers are available at the venue for £2.00. Register at reception and we'll assign you one. Great for keeping your belongings safe while you play.", "category": "Accessibility", "order": 2},
    ]
    for f in faqs:
        Faq.objects.create(**f, active=True)
        print(f"  [CREATED] FAQ: {f['question'][:60]}")

    # ─── SOCIAL LINKS ─────────────────────────────────────────────────────────
    print("\n=== SOCIAL LINKS ===")
    SocialLink.objects.all().delete()
    socials = [
        {"platform": "Instagram", "url": "https://www.instagram.com/gokidsplayleicester", "icon": "Instagram", "order": 1},
        {"platform": "Facebook", "url": "https://www.facebook.com/gokidsplayleicester", "icon": "Facebook", "order": 2},
        {"platform": "TikTok", "url": "https://www.tiktok.com/@gokidsplayleicester", "icon": "TikTok", "order": 3},
        {"platform": "Google", "url": "https://maps.google.com/?q=Spin+Pin+Bowling+Navigation+Street+Leicester", "icon": "MapPin", "order": 4},
    ]
    for s in socials:
        SocialLink.objects.create(**s, active=True)
        print(f"  [CREATED] {s['platform']}")

    # ─── CONTACT INFO ─────────────────────────────────────────────────────────
    print("\n=== CONTACT INFO ===")
    contacts = [
        {"key": "main_phone", "label": "Call Us", "value": "07349110865", "category": "PHONE", "icon": "Phone", "link": "tel:07349110865", "order": 1},
        {"key": "main_email", "label": "Email Us", "value": "info@gokidsplay.co.uk", "category": "EMAIL", "icon": "Mail", "link": "mailto:info@gokidsplay.co.uk", "order": 2},
        {"key": "main_address", "label": "Visit Us", "value": "Navigation Street, Leicester City Centre, LE1 6JS", "category": "ADDRESS", "icon": "MapPin", "link": "https://maps.google.com/?q=Navigation+Street+Leicester+LE1+6JS", "order": 3},
        {"key": "opening_hours_general", "label": "Opening Hours", "value": "Mon: Closed | Tue-Fri: 2PM-9PM (Term) / 10AM-8PM (School Hols) | Sat: 12PM-9PM | Sun: 12PM-8PM", "category": "HOURS", "icon": "Clock", "order": 4},
    ]
    for c in contacts:
        upsert(ContactInfo, {"key": c["key"]}, {**c, "active": True})

    # ─── PARTY PACKAGES ───────────────────────────────────────────────────────
    print("\n=== PARTY PACKAGES ===")
    PartyPackage.objects.all().delete()
    party_packages = [
        {"name": "Skating Party", "description": "Roll into fun with our skating-focused party package! Perfect for birthday parties and celebrations.", "price": "15.99", "min_participants": 10, "max_participants": 30, "duration": 120,
         "includes": ["1.5 hours roller skating session", "Skate hire for all guests", "Safety equipment", "Private party table", "Dedicated party host", "Birthday cake cutting service"],
         "addons": ["Party food package from £4.99pp", "Extra skating time £3pp/30min", "Party bags from £2.99pp"],
         "popular": True, "variant": "primary", "order": 1},
        {"name": "Bowling Party", "description": "Strike up the fun with a bowling-focused party package. Includes exclusive lane bookings.", "price": "15.99", "min_participants": 10, "max_participants": 24, "duration": 90,
         "includes": ["90 min bowling (up to 2 games)", "Shoe hire for all guests", "Auto-scoring lanes", "Private party table", "Dedicated party host", "Birthday cake cutting service"],
         "addons": ["Party food package from £4.99pp", "Extra bowling game £2.50pp", "Party bags from £2.99pp"],
         "popular": False, "variant": "secondary", "order": 2},
        {"name": "Ultimate Party", "description": "The FULL Go Kids Play experience! Skating + Bowling + Arcade tokens all in one amazing party package.", "price": "24.99", "min_participants": 10, "max_participants": 40, "duration": 180,
         "includes": ["Roller skating 1 hour", "Bowling 1 game per person", "£5 arcade token credit per person", "Skate & shoe hire", "Private party room", "Dedicated party host", "Food package included", "Birthday cake cutting"],
         "addons": ["Extra arcade tokens", "Extended party time", "Premium food upgrades"],
         "popular": True, "variant": "accent", "order": 3},
    ]
    for p in party_packages:
        PartyPackage.objects.create(**p, active=True)
        print(f"  [CREATED] PartyPackage: {p['name']}")

    # ─── GROUP PACKAGES ───────────────────────────────────────────────────────
    print("\n=== GROUP PACKAGES ===")
    GroupPackage.objects.all().delete()
    group_packages = [
        {"name": "School Trip Package", "subtitle": "Perfect for educational visits and end-of-term treats", "min_size": "15+ Students", "icon": "Users", "price": "8.99", "price_note": "per student",
         "features": ["Roller skating OR bowling session", "Dedicated group supervisor", "Safety briefing included", "Pre-booking required", "1:10 teacher ratio recommended", "Risk assessment available on request"],
         "color": "primary", "popular": False, "order": 1},
        {"name": "Corporate & Team Events", "subtitle": "Boost morale and team spirit with our fun corporate packages", "min_size": "10+ People", "icon": "Briefcase", "price": "12.99", "price_note": "per person",
         "features": ["Choice of all 3 activities", "Dedicated event coordinator", "Flexible timing", "Food & drink packages available", "Invoice billing available", "Bespoke packages for large groups"],
         "color": "secondary", "popular": True, "order": 2},
        {"name": "College & University Package", "subtitle": "Great for students looking for affordable group fun", "min_size": "10+ Students", "icon": "GraduationCap", "price": "9.99", "price_note": "per person",
         "features": ["Access to all activities", "Group discount applied", "Flexible booking slots", "Student ID required", "Walk-in groups on selected days"],
         "color": "accent", "popular": False, "order": 3},
    ]
    for g in group_packages:
        GroupPackage.objects.create(**g, active=True)
        print(f"  [CREATED] GroupPackage: {g['name']}")

    # ─── GUIDELINE CATEGORIES ─────────────────────────────────────────────────
    print("\n=== GUIDELINE CATEGORIES ===")
    GuidelineCategory.objects.all().delete()
    guidelines = [
        {"title": "General Safety Rules", "icon": "Shield", "order": 1,
         "items": [
             "All visitors must read and agree to our safety rules before participating",
             "Children under 7 must be accompanied by an adult at all times",
             "Go Kids Play staff instructions must be followed at all times",
             "Go Kids Play reserves the right to remove any participant who disregards safety rules",
             "Go Kids Play is not liable for personal injury sustained through failure to follow guidelines",
         ]},
        {"title": "Roller Skating Guidelines", "icon": "Zap", "order": 2,
         "items": [
             "Skate in the same direction as the flow of the rink",
             "No running on the skating rink",
             "Holding hands is limited to pairs – no chain skating",
             "No overtaking or racing permitted",
             "Beginners should use the outer edge of the rink",
             "Wear safety equipment – helmets, knee & wrist pads recommended",
             "No food or drink on the skating rink",
             "Remove skates before leaving the rink area",
         ]},
        {"title": "Bowling Guidelines", "icon": "Target", "order": 3,
         "items": [
             "Bowling shoes must be worn on the lanes at all times",
             "Only bowlers with paid sessions may enter the lane area",
             "Do not cross the foul line onto the bowling lane",
             "Wait for the pin setter to finish before bowling",
             "Children under 7 require adult supervision at the lanes",
             "No food or drink beyond the lane counter area",
             "Bumpers and ramps are available for younger bowlers – ask at reception",
         ]},
        {"title": "Arcade Guidelines", "icon": "Star", "order": 4,
         "items": [
             "Tokens must be purchased at reception",
             "Tokens are non-refundable and non-transferable",
             "Prize ticket values are displayed at the prize counter",
             "One person per machine at a time",
             "Go Kids Play is not liable for personal injury sustained while using arcade machines",
             "Broken or malfunctioning machines should be reported to staff immediately",
         ]},
        {"title": "Dress Code & Attire", "icon": "Shirt", "order": 5,
         "items": [
             "Comfortable clothing appropriate for physical activity is recommended",
             "Loose or overly baggy clothing is not recommended for roller skating",
             "Jewellery and watches should be removed before roller skating for safety",
             "Flat-soled grip socks are recommended under skates",
             "Backpacks and bags should be stored in lockers before participating",
         ]},
        {"title": "Health & Safety", "icon": "Heart", "order": 6,
         "items": [
             "Participants with medical conditions must inform staff before participating",
             "Pregnant visitors are advised against roller skating and VR experiences",
             "Go Kids Play has a qualified first aider on site at all times",
             "First aid kits are available throughout the venue",
             "Emergency exits are clearly marked – please familiarise yourself on arrival",
             "Report any accidents or near-misses to staff immediately",
         ]},
    ]
    for g in guidelines:
        GuidelineCategory.objects.create(**g, active=True)
        print(f"  [CREATED] GuidelineCategory: {g['title']}")

    # ─── MENU SECTIONS ────────────────────────────────────────────────────────
    print("\n=== MENU SECTIONS ===")
    MenuSection.objects.all().delete()
    menus = [
        {"category": "Hot Food", "description": "Freshly prepared hot dishes available during your visit", "icon": "Flame", "color": "primary", "order": 1,
         "items": ["Chips – £2.50", "Chicken Nuggets & Chips – £4.50", "Hot Dog – £3.50", "Nachos with Salsa – £4.00", "Pizza Slice – £3.00"]},
        {"category": "Cold Drinks & Snacks", "description": "Refreshing drinks and light bites", "icon": "Coffee", "color": "secondary", "order": 2,
         "items": ["Soft Drinks – from £1.50", "Water Bottle – £1.00", "Crisps – £1.00", "Chocolate Bar – £1.00", "Ice Cream – £2.00"]},
        {"category": "Party Food Add-on", "description": "Available as part of party packages (price per person)", "icon": "PartyPopper", "color": "accent", "order": 3,
         "items": ["Basic Package (£4.99pp): Sandwiches, chips, squash", "Standard Package (£7.99pp): Hot food selection, soft drink, dessert", "Premium Package (£12.99pp): Full buffet, dessert table, unlimited soft drinks"]},
    ]
    for m in menus:
        MenuSection.objects.create(**m, active=True)
        print(f"  [CREATED] MenuSection: {m['category']}")

    # ─── TIMING CARDS ─────────────────────────────────────────────────────────
    print("\n=== TIMING CARDS ===")
    try:
        TimingCard.objects.all().delete()
        timing_data = [
            {"day_label": "Monday", "open_time": "CLOSED", "close_time": "", "note": "Closed on Mondays", "icon": "Moon", "color": "secondary", "order": 1},
            {"day_label": "Tue – Fri (Term Time)", "open_time": "2:00 PM", "close_time": "9:00 PM", "note": "Last entry 8 PM", "icon": "Clock", "color": "primary", "order": 2},
            {"day_label": "Tue – Fri (School Hols)", "open_time": "10:00 AM", "close_time": "8:00 PM", "note": "Extended hours", "icon": "Sun", "color": "accent", "order": 3},
            {"day_label": "Saturday", "open_time": "12:00 PM", "close_time": "9:00 PM", "note": "Last entry 8 PM", "icon": "Calendar", "color": "primary", "order": 4},
            {"day_label": "Sunday", "open_time": "12:00 PM", "close_time": "8:00 PM", "note": "Last entry 7 PM", "icon": "Calendar", "color": "secondary", "order": 5},
        ]
        for t in timing_data:
            TimingCard.objects.create(**t, active=True)
            print(f"  [CREATED] TimingCard: {t['day_label']}")
    except Exception as e:
        print(f"  [SKIP] TimingCard: {e}")

print("\n\n✅ CMS SEED COMPLETE! All Go Kids Play content has been updated.")
print("Refresh the admin portal to see all changes: http://localhost:5000/admin/cms")
