"""
Go Kids Play CMS Image & Logo Update Script
- Updates Logo in CMS to point to /Go Kids Play-logo.png
- Updates GalleryItems with new Go Kids Play images
- Updates PageSection image_urls with relevant new images
- Deletes old placeholder gallery items
Run: python cms_update_images.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from django.db import transaction
from apps.cms.models import GalleryItem, PageSection

# New Go Kids Play images mapped to descriptive names
SPINPIN_IMAGES = [
    {"file": "/images/Go Kids Play/unnamed.webp",      "title": "Go Kids Play Venue Interior",      "category": "venue"},
    {"file": "/images/Go Kids Play/unnamed (1).webp",   "title": "Roller Skating Rink",         "category": "skating"},
    {"file": "/images/Go Kids Play/unnamed (2).webp",   "title": "Bowling Lanes",               "category": "bowling"},
    {"file": "/images/Go Kids Play/unnamed (3).webp",   "title": "Arcade Games Area",           "category": "arcade"},
    {"file": "/images/Go Kids Play/unnamed (4).webp",   "title": "Fun at Go Kids Play",             "category": "fun"},
    {"file": "/images/Go Kids Play/unnamed (5).webp",   "title": "Skating Action",              "category": "skating"},
    {"file": "/images/Go Kids Play/unnamed (6).webp",   "title": "Party & Events Area",         "category": "parties"},
    {"file": "/images/Go Kids Play/unnamed (7).webp",   "title": "Go Kids Play Leicester",           "category": "venue"},
    {"file": "/images/Go Kids Play/unnamed (8).webp",   "title": "Bowling Strike",              "category": "bowling"},
    {"file": "/images/Go Kids Play/unnamed (9).webp",   "title": "Arcade Fun",                  "category": "arcade"},
    {"file": "/images/Go Kids Play/unnamed (10).webp",  "title": "Go Kids Play Activities",         "category": "fun"},
    {"file": "/images/Go Kids Play/unnamed (11).webp",  "title": "Family Fun",                  "category": "fun"},
    {"file": "/images/Go Kids Play/unnamed (12).webp",  "title": "Skating Party",               "category": "parties"},
    {"file": "/images/Go Kids Play/2025-04-15.webp",    "title": "Go Kids Play 2025",                "category": "venue"},
    {"file": "/images/Go Kids Play/2025-05-01.webp",    "title": "Go Kids Play May 2025",           "category": "venue"},
]

with transaction.atomic():
    # ─── Gallery Items ─────────────────────────────────────────────────────────
    print("=== GALLERY ITEMS ===")
    # Delete old placeholder gallery items
    deleted_count = GalleryItem.objects.all().delete()[0]
    print(f"  Deleted {deleted_count} old gallery items")

    # Create new ones from Go Kids Play images
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
        ("home", "hero"):        "/images/Go Kids Play/unnamed.webp",
        ("home", "about"):       "/images/Go Kids Play/unnamed (4).webp",
        ("about", "hero"):       "/images/Go Kids Play/unnamed (1).webp",
        ("about", "story"):      "/images/Go Kids Play/unnamed (11).webp",
        ("parties", "hero"):     "/images/Go Kids Play/unnamed (12).webp",
        ("attractions", "hero"): "/images/Go Kids Play/unnamed (2).webp",
        ("pricing", "hero"):     "/images/Go Kids Play/unnamed (8).webp",
        ("groups", "hero"):      "/images/Go Kids Play/unnamed (6).webp",
        ("contact", "hero"):     "/images/Go Kids Play/unnamed (7).webp",
        ("guidelines", "hero"):  "/images/Go Kids Play/unnamed (5).webp",
        ("faq", "hero"):         "/images/Go Kids Play/unnamed (10).webp",
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
            name="Go Kids Play Logo",
            defaults={
                "image_url": "/Go Kids Play-logo.png",
                "active": True,
            }
        )
        if not created:
            logo.image_url = "/Go Kids Play-logo.png"
            logo.active = True
            logo.save()
        print(f"  [{'CREATED' if created else 'UPDATED'}] Logo -> /Go Kids Play-logo.png")
    except Exception as e:
        print(f"  [SKIP] Logo update via CMS model: {e}")

    # Update AnimatedHero with a real image too
    print("\n=== HERO BACKGROUND ===")
    try:
        from apps.cms.models import Settings
        # just update hero background reference
        settings = Settings.objects.first()
        if settings:
            settings.hero_background = "/images/Go Kids Play/unnamed.webp"
            settings.save()
            print("  [UPDATED] Settings hero_background")
    except Exception as e:
        print(f"  [SKIP] Settings update: {e}")

print("\n✅ Images and gallery updated with Go Kids Play images!")
