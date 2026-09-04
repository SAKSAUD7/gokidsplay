"""Reseed gallery images, page section images, and activity images with SpinPin photos"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from django.db import transaction

BASE_URL = "/images/spinpin"

GALLERY = [
    ("unnamed.webp",      "Spin Pin Leicester Venue",    "Venue",          1),
    ("unnamed (1).webp",  "Roller Skating Rink",         "Roller Skating", 2),
    ("unnamed (2).webp",  "Ten Pin Bowling Lanes",       "Bowling",        3),
    ("unnamed (3).webp",  "Arcade Games Zone",           "Arcade",         4),
    ("unnamed (4).webp",  "Skating Action",              "Roller Skating", 5),
    ("unnamed (5).webp",  "Bowling Fun",                 "Bowling",        6),
    ("unnamed (6).webp",  "Arcade Machines",             "Arcade",         7),
    ("unnamed (7).webp",  "Spin Pin Group Fun",          "Venue",          8),
    ("unnamed (8).webp",  "Skating Rink Overview",       "Roller Skating", 9),
    ("unnamed (9).webp",  "Bowling Strike",              "Bowling",        10),
    ("unnamed (10).webp", "Arcade Fun",                  "Arcade",         11),
    ("unnamed (11).webp", "Spin Pin Events",             "Venue",          12),
    ("unnamed (12).webp", "Spin Pin Night Out",          "Venue",          13),
    ("2025-04-15.webp",   "Spin Pin Opening Day",        "Venue",          14),
    ("2025-05-01.webp",   "Spin Pin Bank Holiday",       "Venue",          15),
]

with transaction.atomic():
    # 1. Gallery Items
    print("=== GALLERY ITEMS ===")
    from apps.cms.models import GalleryItem
    GalleryItem.objects.all().delete()
    for filename, title, category, order in GALLERY:
        GalleryItem.objects.create(
            title=title,
            image_url=f"{BASE_URL}/{filename}",
            category=category,
            order=order,
            active=True,
        )
        print(f"  [OK] {title} ({category})")
    print(f"  Total: {GalleryItem.objects.count()}")

    # 2. Page Section Images
    print("\n=== PAGE SECTION IMAGES ===")
    from apps.cms.models import PageSection

    SECTION_IMGS = {
        ("home",        "hero"):         "unnamed (1).webp",
        ("home",        "about"):        "unnamed (7).webp",
        ("about",       "hero"):         "unnamed (11).webp",
        ("about",       "story"):        "unnamed (7).webp",
        ("attractions", "hero"):         "unnamed (8).webp",
        ("parties",     "hero"):         "unnamed (12).webp",
        ("pricing",     "hero"):         "unnamed (5).webp",
        ("groups",      "hero"):         "unnamed (4).webp",
        ("contact",     "hero"):         "unnamed (11).webp",
        ("guidelines",  "hero"):         "unnamed (7).webp",
        ("gallery",     "hero"):         "unnamed.webp",
        ("faq",         "hero"):         "unnamed (10).webp",
    }

    for (page_slug, section_key), img_file in SECTION_IMGS.items():
        qs = PageSection.objects.filter(page__slug=page_slug, section_key=section_key)
        if qs.exists():
            qs.update(image_url=f"{BASE_URL}/{img_file}")
            print(f"  [OK] {page_slug}/{section_key} -> {img_file}")
        else:
            print(f"  [--] {page_slug}/{section_key} not found")

    # 3. Activity Images
    print("\n=== ACTIVITY IMAGES ===")
    from apps.cms.models import Activity

    ACTIVITY_IMGS = {
        "skating": f"{BASE_URL}/unnamed (1).webp",
        "bowling": f"{BASE_URL}/unnamed (2).webp",
        "arcade":  f"{BASE_URL}/unnamed (3).webp",
    }

    for activity in Activity.objects.all():
        name_lower = activity.name.lower()
        for key, url in ACTIVITY_IMGS.items():
            if key in name_lower:
                activity.image_url = url
                activity.save()
                print(f"  [OK] {activity.name} -> {url.split('/')[-1]}")
                break

print("\nDone!")
