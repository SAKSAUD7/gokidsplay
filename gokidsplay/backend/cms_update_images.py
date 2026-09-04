"""
SpinPin CMS Image & Logo Update Script
- Updates Logo in CMS to point to /spinpin-logo.png
- Updates GalleryItems with new SpinPin images
- Updates PageSection image_urls with relevant new images
- Deletes old placeholder gallery items
Run: python cms_update_images.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from django.db import transaction
from apps.cms.models import GalleryItem, PageSection

# New SpinPin images mapped to descriptive names
SPINPIN_IMAGES = [
    {"file": "/images/spinpin/unnamed.webp",      "title": "Spin Pin Venue Interior",      "category": "venue"},
    {"file": "/images/spinpin/unnamed (1).webp",   "title": "Roller Skating Rink",         "category": "skating"},
    {"file": "/images/spinpin/unnamed (2).webp",   "title": "Bowling Lanes",               "category": "bowling"},
    {"file": "/images/spinpin/unnamed (3).webp",   "title": "Arcade Games Area",           "category": "arcade"},
    {"file": "/images/spinpin/unnamed (4).webp",   "title": "Fun at Spin Pin",             "category": "fun"},
    {"file": "/images/spinpin/unnamed (5).webp",   "title": "Skating Action",              "category": "skating"},
    {"file": "/images/spinpin/unnamed (6).webp",   "title": "Party & Events Area",         "category": "parties"},
    {"file": "/images/spinpin/unnamed (7).webp",   "title": "SpinPin Leicester",           "category": "venue"},
    {"file": "/images/spinpin/unnamed (8).webp",   "title": "Bowling Strike",              "category": "bowling"},
    {"file": "/images/spinpin/unnamed (9).webp",   "title": "Arcade Fun",                  "category": "arcade"},
    {"file": "/images/spinpin/unnamed (10).webp",  "title": "Spin Pin Activities",         "category": "fun"},
    {"file": "/images/spinpin/unnamed (11).webp",  "title": "Family Fun",                  "category": "fun"},
    {"file": "/images/spinpin/unnamed (12).webp",  "title": "Skating Party",               "category": "parties"},
    {"file": "/images/spinpin/2025-04-15.webp",    "title": "SpinPin 2025",                "category": "venue"},
    {"file": "/images/spinpin/2025-05-01.webp",    "title": "Spin Pin May 2025",           "category": "venue"},
]

with transaction.atomic():
    # ─── Gallery Items ─────────────────────────────────────────────────────────
    print("=== GALLERY ITEMS ===")
    # Delete old placeholder gallery items
    deleted_count = GalleryItem.objects.all().delete()[0]
    print(f"  Deleted {deleted_count} old gallery items")

    # Create new ones from SpinPin images
    for i, img in enumerate(SPINPIN_IMAGES):
        GalleryItem.objects.create(
            title=img["title"],
            image_url=img["file"],
            category=img["category"],
            order=i + 1,
            active=True
        )
        print(f"  [CREATED] GalleryItem: {img['title']}")

    # ─── Page Section Image URLs ───────────────────────────────────────────────
    print("\n=== PAGE SECTION IMAGES ===")
    # Map section -> image
    section_images = {
        ("home", "hero"):        "/images/spinpin/unnamed.webp",
        ("home", "about"):       "/images/spinpin/unnamed (4).webp",
        ("about", "hero"):       "/images/spinpin/unnamed (1).webp",
        ("about", "story"):      "/images/spinpin/unnamed (11).webp",
        ("parties", "hero"):     "/images/spinpin/unnamed (12).webp",
        ("attractions", "hero"): "/images/spinpin/unnamed (2).webp",
        ("pricing", "hero"):     "/images/spinpin/unnamed (8).webp",
        ("groups", "hero"):      "/images/spinpin/unnamed (6).webp",
        ("contact", "hero"):     "/images/spinpin/unnamed (7).webp",
        ("guidelines", "hero"):  "/images/spinpin/unnamed (5).webp",
        ("faq", "hero"):         "/images/spinpin/unnamed (10).webp",
    }

    for (page, section_key), image_url in section_images.items():
        updated = PageSection.objects.filter(page=page, section_key=section_key).update(image_url=image_url)
        print(f"  [UPDATED] PageSection {page}/{section_key} -> {image_url} (rows={updated})")

    # ─── Update Logo in CMS Logos table if exists ──────────────────────────────
    print("\n=== LOGO ===")
    try:
        from apps.core.models import Logo
        # Deactivate any Ninja logo
        Logo.objects.filter(active=True).update(active=False)
        logo, created = Logo.objects.get_or_create(
            name="Spin Pin Logo",
            defaults={
                "image_url": "/spinpin-logo.png",
                "active": True,
            }
        )
        if not created:
            logo.image_url = "/spinpin-logo.png"
            logo.active = True
            logo.save()
        print(f"  [{'CREATED' if created else 'UPDATED'}] Logo -> /spinpin-logo.png")
    except Exception as e:
        print(f"  [SKIP] Logo update via CMS model: {e}")

    # Update AnimatedHero with a real image too
    print("\n=== HERO BACKGROUND ===")
    try:
        from apps.cms.models import Settings
        # just update hero background reference
        settings = Settings.objects.first()
        if settings:
            settings.hero_background = "/images/spinpin/unnamed.webp"
            settings.save()
            print("  [UPDATED] Settings hero_background")
    except Exception as e:
        print(f"  [SKIP] Settings update: {e}")

print("\n✅ Images and gallery updated with SpinPin images!")
