#!/usr/bin/env python
"""
Go Kids Play Coventry - CMS Seed Script (corrected field names)
Run: python seed_gkp_content.py
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.cms.models import (
    Activity, PageSection, StatCard, TimingCard, ContactInfo, PartyPackage, PricingPlan
)


def seed_activities():
    print("Seeding Go Kids Play activities...")
    activities = [
        {
            'name': 'Soft Play',
            'slug': 'soft-play',
            'short_description': 'Safe, fun Soft Play for toddlers and young children.',
            'description': (
                "Go Kids Play Coventry's Soft Play area is a safe and exciting zone for toddlers "
                "and young children. With tunnels, slides, ball pits, and climbing frames, "
                "children can explore and play in a safe, supervised environment. "
                "Perfect for birthday parties, family days out, and school holiday fun."
            ),
            'image_url': '/images/gokidsplay/unnamed (4).webp',
            'why_choose_us': 'Safe supervised environment. Age-appropriate zones. Perfect for parties.',
            'what_to_expect': 'Multi-level soft play structure, ball pits, slides and tunnels in a safe environment.',
            'active': True,
            'order': 1,
        },
        {
            'name': 'Laser Arena',
            'slug': 'laser-arena',
            'short_description': 'High-tech laser tag battles for kids aged 6 and above.',
            'description': (
                "Our state-of-the-art Laser Arena brings team-based laser tag excitement to "
                "Go Kids Play Coventry. Grab your phaser, pick your team, and battle it out "
                "in our atmospheric arena — perfect for older kids and competitive groups. "
                "Features UV lighting, fog effects, and professional equipment."
            ),
            'image_url': '/images/gokidsplay/unnamed (5).webp',
            'why_choose_us': 'Professional equipment. Immersive atmosphere. Team battle fun.',
            'what_to_expect': 'UV-lit arena with fog effects, team battles and real-time score tracking.',
            'active': True,
            'order': 2,
        },
        {
            'name': 'Go Karts',
            'slug': 'go-kart',
            'short_description': 'Indoor Go Karts for young racing drivers.',
            'description': (
                "Put the pedal to the metal in Go Kids Play Coventry's indoor Go Kart track! "
                "Our battery-powered karts are perfect for young drivers wanting to experience "
                "the thrill of racing in a safe, supervised environment. "
                "Helmets and safety equipment provided."
            ),
            'image_url': '/images/gokidsplay/unnamed (6).webp',
            'why_choose_us': 'Safe indoor track. Battery-powered karts. Perfect for all ages.',
            'what_to_expect': 'Indoor kart track with battery-powered karts, safety equipment included.',
            'active': True,
            'order': 3,
        },
        {
            'name': 'Inflatable Park',
            'slug': 'inflatable-park',
            'short_description': 'Giant inflatables, obstacle courses and slides.',
            'description': (
                "Bounce, slide and jump through Go Kids Play Coventry's Inflatable Park! "
                "Our massive inflatables include obstacle courses, giant slides, and bounce "
                "castles — guaranteed fun for children of all ages. "
                "Grip socks required (available in venue)."
            ),
            'image_url': '/images/gokidsplay/unnamed (7).webp',
            'why_choose_us': 'Massive inflatables. Giant slides. Fun for all ages.',
            'what_to_expect': 'Inflatable obstacle courses, giant slides, and bounce castles.',
            'active': True,
            'order': 4,
        },
    ]
    for data in activities:
        try:
            Activity.objects.update_or_create(slug=data['slug'], defaults=data)
            print(f"  v {data['name']}")
        except Exception as e:
            print(f"  X {data['name']}: {e}")
    print()


def seed_party_packages():
    print("\nSeeding party packages...")
    packages = [
        {
            'name': 'Go Kids Play Party Package',
            'description': (
                'Party package cost £250. It includes the following:\n'
                '- Entry for 10 Kids (Additional Child £20 Each)\n'
                '- Free entry for 10 adults (Additional Adult £4.95 Each)\n'
                '- 75 Minutes of Play (Soft Play, Laser Quest & Go Kart)\n'
                '- 45 Minutes use of Party area\n'
                '- Party Food for Kids (Sandwiches, Pizza, Chicken, Chips etc)\n'
                '- Drinks: Squash and Mini slush\n'
                '- Online Party Invitation'
            ),
            'price': 250.00,
            'min_participants': 10,
            'max_participants': 30,
            'duration': 120,
            'includes': [
                'Entry for 10 Kids',
                'Free entry for 10 adults',
                '75 Mins Play (Soft Play, Laser, Go Kart)',
                '45 Mins Party Area',
                'Party Food, Squash & Slush',
                'Online Invitation'
            ],
            'addons': [
                'Additional Child (£20)',
                'Additional Adult (£4.95)',
                'Inflatable Park access (£5 per person)'
            ],
            'popular': True,
            'active': True,
            'order': 1,
        }
    ]
    for data in packages:
        try:
            PartyPackage.objects.update_or_create(name=data['name'], defaults=data)
            print(f"  v {data['name']}")
        except Exception as e:
            print(f"  X {data['name']}: {e}")
    print()

def seed_pricing_plans():
    print("Seeding pricing plans...")
    plans = [
        {
            'name': 'Under 12 months',
            'type': 'SESSION',
            'age_group': 'Under 12 months',
            'price': 1.95,
            'duration': 120,
            'period_text': '/ 2 Hours',
            'description': 'Access to Toddler Play Area.',
            'features': ['2 Hours Play', 'Access to toddler zone'],
            'popular': False,
            'active': True,
            'order': 1,
        },
        {
            'name': 'Under 24 months',
            'type': 'SESSION',
            'age_group': '1 - 2 Years',
            'price': 7.95,
            'duration': 120,
            'period_text': '/ 2 Hours',
            'description': 'Full access to age-appropriate activities.',
            'features': ['2 Hours Play', 'Soft Play Access'],
            'popular': False,
            'active': True,
            'order': 2,
        },
        {
            'name': '24 months and above',
            'type': 'SESSION',
            'age_group': '2+ Years',
            'price': 12.95,
            'duration': 120,
            'period_text': '/ 2 Hours',
            'description': 'Access to all main activities including Mega Soft Play, Laser Arena, and Go Karts.',
            'features': ['2 Hours Play', 'Mega Soft Play', 'Laser Arena', 'Go Karts'],
            'popular': True,
            'active': True,
            'order': 3,
        },
        {
            'name': 'Non-playing Adult',
            'type': 'SESSION',
            'age_group': 'Adult',
            'price': 4.95,
            'duration': 120,
            'period_text': '/ 2 Hours',
            'description': 'Entry for supervising adults.',
            'features': ['Supervision Entry', 'Cafe Access'],
            'popular': False,
            'active': True,
            'order': 4,
        }
    ]
    for data in plans:
        try:
            PricingPlan.objects.update_or_create(name=data['name'], type=data['type'], defaults=data)
            print(f"  v {data['name']}")
        except Exception as e:
            print(f"  X {data['name']}: {e}")
    print()


def seed_page_sections():
    print("Seeding page sections...")
    sections = [
        {
            'page': 'home',
            'section_key': 'hero',
            'title': 'The Ultimate Kids Play Experience in Coventry',
            'subtitle': 'Soft Play - Laser Arena - Go Karts - Inflatable Park',
            'content': '',
            'active': True,
            'order': 1,
        },
        {
            'page': 'home',
            'section_key': 'about',
            'title': "Coventry's Ultimate Kids Play Centre",
            'subtitle': 'Fun for the whole family',
            'content': (
                "Go Kids Play Coventry is the ultimate family entertainment venue, packed with "
                "Soft Play, Laser Arena, Go Karts and an Inflatable Park. The perfect adventure "
                "for kids of all ages, from toddlers to teenagers. Book your session, plan your "
                "party, or come for a fun-filled family day out."
            ),
            'active': True,
            'order': 2,
        },
        {
            'page': 'about',
            'section_key': 'main',
            'title': "About Go Kids Play Coventry",
            'subtitle': "Where every child's adventure begins",
            'content': (
                "Go Kids Play Coventry is a family entertainment venue created to give children "
                "the most exciting, safe, and memorable experiences possible. From our vibrant "
                "Soft Play area to our adrenaline-pumping Laser Arena, thrilling Go Kart track, "
                "and massive Inflatable Park, we have something for every child.\n\n"
                "We are committed to safety, fun, and creating unforgettable memories for "
                "families across Coventry and the surrounding areas."
            ),
            'active': True,
            'order': 1,
        },
    ]
    for data in sections:
        try:
            PageSection.objects.update_or_create(
                page=data['page'], section_key=data['section_key'],
                defaults=data
            )
            print(f"  v {data['page']}/{data['section_key']}")
        except Exception as e:
            print(f"  X {data['page']}/{data['section_key']}: {e}")
    print()


def seed_stat_cards():
    print("Seeding stat cards...")
    stats = [
        {'page': 'home', 'value': '4', 'label': 'Amazing Activities', 'icon': 'Trophy', 'order': 1, 'active': True},
        {'page': 'home', 'value': '1,000+', 'label': 'Happy Families', 'icon': 'Users', 'order': 2, 'active': True},
        {'page': 'home', 'value': '2hrs', 'label': 'Session Duration', 'icon': 'Zap', 'order': 3, 'active': True},
        {'page': 'home', 'value': '100%', 'label': 'Safe & Supervised', 'icon': 'Shield', 'order': 4, 'active': True},
    ]
    for data in stats:
        try:
            StatCard.objects.update_or_create(page=data['page'], label=data['label'], defaults=data)
            print(f"  v {data['label']}")
        except Exception as e:
            print(f"  X {data['label']}: {e}")
    print()


def seed_timing_cards():
    print("Seeding timing/opening hours...")
    timings = [
        {'day_label': 'Thursday & Friday', 'open_time': '15:00', 'close_time': '20:00', 'note': 'Open after school', 'icon': 'calendar', 'active': True, 'order': 1},
        {'day_label': 'Saturday & Sunday', 'open_time': '12:00', 'close_time': '20:00', 'note': 'Full day fun', 'icon': 'sun', 'active': True, 'order': 2},
        {'day_label': 'School Holidays', 'open_time': '10:00', 'close_time': '20:00', 'note': 'Extended holiday hours', 'icon': 'star', 'active': True, 'order': 3},
    ]
    for data in timings:
        try:
            TimingCard.objects.update_or_create(day_label=data['day_label'], defaults=data)
            print(f"  v {data['day_label']}")
        except Exception as e:
            print(f"  X {data['day_label']}: {e}")
    print()


def seed_contact_info():
    print("Seeding contact info...")
    contacts = [
        {'key': 'phone', 'label': 'Phone', 'value': '07349110865', 'category': 'contact', 'icon': 'phone', 'active': True, 'order': 1},
        {'key': 'email', 'label': 'Email', 'value': 'info@gokidsplay.co.uk', 'category': 'contact', 'icon': 'mail', 'active': True, 'order': 2},
        {'key': 'address', 'label': 'Address', 'value': 'Go Kids Play Coventry, Coventry, CV1', 'category': 'location', 'icon': 'map-pin', 'active': True, 'order': 3},
        {'key': 'hours', 'label': 'Opening Hours', 'value': 'Thu-Fri: 3pm-8pm | Sat-Sun: 12pm-8pm', 'category': 'hours', 'icon': 'clock', 'active': True, 'order': 4},
    ]
    for data in contacts:
        try:
            ContactInfo.objects.update_or_create(key=data['key'], defaults=data)
            print(f"  v {data['label']}")
        except Exception as e:
            print(f"  X {data['label']}: {e}")
    print()


if __name__ == '__main__':
    print("=" * 60)
    print("GO KIDS PLAY COVENTRY - CMS SEED")
    print("=" * 60)
    print()
    seed_activities()
    seed_party_packages()
    seed_pricing_plans()
    seed_page_sections()
    seed_stat_cards()
    seed_timing_cards()
    seed_contact_info()
    print("=" * 60)
    print("GKP CMS seed complete!")
    print("=" * 60)
