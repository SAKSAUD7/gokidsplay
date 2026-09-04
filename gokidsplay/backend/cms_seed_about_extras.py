"""
SpinPin CMS - Timeline Items, Value Items, Booking Information, & Legal Docs seed
Run: python cms_seed_about_extras.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from django.db import transaction

with transaction.atomic():

    # ─── TIMELINE ITEMS ───────────────────────────────────────────────────────
    print("=== TIMELINE ITEMS ===")
    try:
        from apps.cms.models import TimelineItem
        TimelineItem.objects.all().delete()
        timeline = [
            {"year": "2019", "title": "The Dream Begins",
             "description": "Conceptualised a premier entertainment venue for Leicester City Centre — combining roller skating, bowling and arcade gaming under one roof.",
             "order": 1},
            {"year": "2020", "title": "Finding Our Home",
             "description": "Secured the perfect venue at Navigation Street, Leicester City Centre — right in the heart of Leicester for maximum accessibility.",
             "order": 2},
            {"year": "2021", "title": "Building the Dream",
             "description": "Began major refurbishment and fit-out of Ramdoot House. Installing bowling lanes, the skating rink, and 100+ arcade machines.",
             "order": 3},
            {"year": "2022", "title": "Grand Opening",
             "description": "Spin Pin Leicester opened its doors! Hundreds of visitors experienced roller skating, bowling and arcade games for the first time at our venue.",
             "order": 4},
            {"year": "2023", "title": "Growing With Leicester",
             "description": "Became Leicester's most-reviewed entertainment venue. Added VR gaming experiences and expanded our arcade with over 100 machines.",
             "order": 5},
            {"year": "2024", "title": "Community & Events",
             "description": "Launched school trip packages, corporate events, and birthday party packages. Hosted over 500+ parties and group events.",
             "order": 6},
            {"year": "2025", "title": "Going From Strength to Strength",
             "description": "Continued expanding with new improvements, a refreshed party menu, and more — cementing Spin Pin as Leicester's #1 family entertainment destination.",
             "order": 7},
        ]
        for t in timeline:
            TimelineItem.objects.create(**t, active=True)
            print(f"  [CREATED] {t['year']}: {t['title']}")
    except Exception as e:
        print(f"  [ERROR] TimelineItem: {e}")

    # ─── VALUE ITEMS ──────────────────────────────────────────────────────────
    print("\n=== VALUE ITEMS ===")
    try:
        from apps.cms.models import ValueItem
        ValueItem.objects.all().delete()
        values = [
            {"title": "Fun First",
             "description": "Everything we do is designed to maximise fun. We believe people of all ages deserve great entertainment that creates lasting memories.",
             "icon": "Zap", "color": "primary", "order": 1},
            {"title": "Family Friendly",
             "description": "We welcome everyone from toddlers to grandparents. Our venue is designed to be inclusive, safe, and enjoyable for the whole family.",
             "icon": "Heart", "color": "secondary", "order": 2},
            {"title": "Safety Always",
             "description": "Your safety is our top priority. All equipment is regularly maintained, staff are trained in first aid, and safety guidelines are clearly communicated.",
             "icon": "Shield", "color": "accent", "order": 3},
            {"title": "Community",
             "description": "We're proud to be part of the Leicester community. We support local schools, charities, and groups with special packages and events.",
             "icon": "Users", "color": "primary", "order": 4},
            {"title": "Quality Experience",
             "description": "From professional-grade bowling lanes to a smooth skating rink and 100+ arcade machines — we invest in quality so you can enjoy the best.",
             "icon": "Trophy", "color": "secondary", "order": 5},
            {"title": "Always Welcoming",
             "description": "Walk-ins are always welcome! Whether it's a spontaneous family outing or a planned party, our doors are open and our team is ready.",
             "icon": "Star", "color": "accent", "order": 6},
        ]
        for v in values:
            ValueItem.objects.create(**v, active=True)
            print(f"  [CREATED] {v['title']}")
    except Exception as e:
        print(f"  [ERROR] ValueItem: {e}")

    # ─── BOOKING INFORMATION ──────────────────────────────────────────────────
    print("\n=== BOOKING INFORMATION ===")
    try:
        from apps.cms.models import BookingInformation
        BookingInformation.objects.all().delete()
        BookingInformation.objects.create(
            booking_type="SESSION",
            title="Book a Session",
            subtitle="Roller Skating · Ten Pin Bowling · Arcade Games",
            content="Walk-ins are always welcome at Spin Pin Leicester! However, we strongly recommend booking online — especially for weekends and school holidays — to guarantee your spot. Book in advance and save time at the venue.",
            rules_content="Please arrive 15 minutes before your session. Last entry is 1 hour before closing. Children under 7 must be accompanied by an adult at all times. Safety equipment is highly recommended for all skaters.",
            sessions_info=[
                {"label": "Term Time (Tue-Fri)", "hours": "2:00 PM – 9:00 PM", "note": "Last entry 8 PM"},
                {"label": "School Holidays (Tue-Fri)", "hours": "10:00 AM – 8:00 PM", "note": "Extended hours"},
                {"label": "Saturday", "hours": "12:00 PM – 9:00 PM", "note": "Last entry 8 PM"},
                {"label": "Sunday", "hours": "12:00 PM – 8:00 PM", "note": "Last entry 7 PM"},
                {"label": "Monday", "hours": "CLOSED", "note": ""},
            ],
            active=True
        )
        BookingInformation.objects.create(
            booking_type="PARTY",
            title="Book a Party",
            subtitle="Birthday Parties · School Trips · Corporate Events",
            content="We love hosting parties at Spin Pin Leicester! Whether it's a birthday bash, school trip, or corporate team event, we have packages to suit every occasion and budget. Get in touch to discuss your requirements and we'll create the perfect experience.",
            rules_content="Party bookings require a deposit at the time of booking. Minimum 10 guests for party packages. Final numbers must be confirmed 48 hours before the event. All party guests must sign in at reception. We provide a dedicated party host for all party packages.",
            sessions_info=[
                {"label": "Booking Lead Time", "hours": "Minimum 2 weeks advance notice", "note": "4+ weeks recommended for weekends"},
                {"label": "Party Duration", "hours": "2–3 hours depending on package", "note": "Can be extended for an additional fee"},
                {"label": "Party Times", "hours": "Available daily during opening hours", "note": "Subject to availability"},
            ],
            active=True
        )
        print("  [CREATED] SESSION booking information")
        print("  [CREATED] PARTY booking information")
    except Exception as e:
        print(f"  [ERROR] BookingInformation: {e}")

    # ─── LEGAL DOCUMENTS (Terms, Privacy, Waiver) ─────────────────────────────
    print("\n=== LEGAL DOCUMENTS ===")
    try:
        from apps.cms.models import LegalDocument
        for doc_type, title, intro, sections_data in [
            (
                "TERMS", "Terms & Conditions", 
                "By visiting and using Spin Pin Leicester, you agree to these terms and conditions. Please read them carefully before your visit.",
                [
                    {"title": "Acceptance of Terms",
                     "content": "By entering Spin Pin Leicester, you agree to abide by all rules, guidelines, and terms of use as stated. These terms apply to all visitors, regardless of age."},
                    {"title": "Liability Disclaimer",
                     "content": "Spin Pin Leicester operates a safe venue but cannot accept liability for personal injury, loss, or damage caused by failure to follow posted guidelines or staff instructions. Participation in all activities is at your own risk."},
                    {"title": "Health & Safety",
                     "content": "Visitors with health conditions should consult their doctor before participating. Pregnant visitors are advised not to participate in roller skating or VR experiences."},
                    {"title": "Booking & Refunds",
                     "content": "Bookings are non-refundable but may be transferred to another date with at least 48 hours' notice. In the event of venue closure, a full refund or rebooking will be offered."},
                    {"title": "Photography",
                     "content": "Spin Pin may photograph or video record the venue for promotional purposes. By entering the venue you consent to being photographed. Please inform staff if you do not wish to be included."},
                    {"title": "Lost Property",
                     "content": "Spin Pin is not responsible for lost or stolen items. We recommend using our lockers (£2.00) to secure your belongings."},
                ]
            ),
            (
                "PRIVACY", "Privacy Policy",
                "Your privacy matters to us. This policy explains how Spin Pin Leicester collects, uses, and protects your personal data.",
                [
                    {"title": "Data We Collect",
                     "content": "We collect personal information when you make a booking, contact us, or interact with our website. This may include your name, email address, phone number, and payment details (processed securely via third-party payment providers)."},
                    {"title": "How We Use Your Data",
                     "content": "Your data is used to process bookings, send booking confirmations, respond to enquiries, and improve our services. We do not sell your data to third parties."},
                    {"title": "Data Protection",
                     "content": "We comply with UK GDPR and the Data Protection Act 2018. Your data is stored securely and accessed only by authorised Spin Pin staff."},
                    {"title": "Your Rights",
                     "content": "You have the right to access, correct, or delete your personal data at any time. Email us at info@spinpin.co.uk to make a data request."},
                    {"title": "Contact Us",
                     "content": "If you have any questions about our privacy policy, please contact us at info@spinpin.co.uk or call 07349110865."},
                ]
            ),
            (
                "WAIVER", "Participant Waiver",
                "Please read this waiver carefully. All participants must agree to these terms before participating in activities at Spin Pin Leicester.",
                [
                    {"title": "Acknowledgement of Risk",
                     "content": "I understand that roller skating, bowling, VR, and arcade activities carry inherent risks including the risk of injury. I voluntarily choose to participate knowing these risks."},
                    {"title": "Assumption of Risk",
                     "content": "I voluntarily assume all risks associated with participation in activities at Spin Pin Leicester, including but not limited to falls, collisions, and equipment-related injuries."},
                    {"title": "Release of Liability",
                     "content": "I, on behalf of myself (and any minor children in my care), release Spin Pin Leicester, its owners, employees, and agents from all liability for any injury, loss, or damage sustained during my visit."},
                    {"title": "Medical Conditions",
                     "content": "I confirm that I (and any minor children in my care) do not have any medical conditions that would make participation in these activities inappropriate. If unsure, I will consult a doctor before participating."},
                    {"title": "Agreement to Follow Rules",
                     "content": "I agree to follow all safety rules, guidelines, and staff instructions at all times during my visit to Spin Pin Leicester."},
                ]
            ),
        ]:
            obj, created = LegalDocument.objects.get_or_create(
                document_type=doc_type,
                defaults={"title": title, "intro": intro, "sections": sections_data, "active": True}
            )
            if not created:
                obj.title = title
                obj.intro = intro
                obj.sections = sections_data
                obj.active = True
                obj.save()
            status = "CREATED" if created else "UPDATED"
            print(f"  [{status}] {title}")
    except Exception as e:
        print(f"  [ERROR] LegalDocument: {e}")

print("\n\n✅ About page extras, booking info & legal docs seeded successfully!")
