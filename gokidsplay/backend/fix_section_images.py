"""Fix PageSection and Activity images using raw SQL (bypasses URLField validation)"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from django.db import connection

BASE = '/images/spinpin'

SECTION_IMGS = [
    ('home',        'hero',    'unnamed (1).webp'),
    ('home',        'about',   'unnamed (7).webp'),
    ('about',       'hero',    'unnamed (11).webp'),
    ('about',       'story',   'unnamed (7).webp'),
    ('attractions', 'hero',    'unnamed (8).webp'),
    ('parties',     'hero',    'unnamed (12).webp'),
    ('pricing',     'hero',    'unnamed (5).webp'),
    ('groups',      'hero',    'unnamed (4).webp'),
    ('contact',     'hero',    'unnamed (11).webp'),
    ('guidelines',  'hero',    'unnamed (7).webp'),
    ('gallery',     'hero',    'unnamed.webp'),
    ('faq',         'hero',    'unnamed (10).webp'),
]

print("=== PAGE SECTION IMAGES ===")
with connection.cursor() as cur:
    for page, section, img in SECTION_IMGS:
        url = BASE + '/' + img
        cur.execute(
            'UPDATE cms_pagesection SET image_url=%s WHERE page=%s AND section_key=%s',
            [url, page, section]
        )
        print(f"  {page}/{section} -> {img} ({cur.rowcount} rows)")

print("\n=== ACTIVITY IMAGES ===")
ACTIVITY_IMGS = [
    ('skating', BASE + '/unnamed (1).webp'),
    ('bowling', BASE + '/unnamed (2).webp'),
    ('arcade',  BASE + '/unnamed (3).webp'),
]

from apps.cms.models import Activity
for activity in Activity.objects.all():
    n = activity.name.lower()
    for key, url in ACTIVITY_IMGS:
        if key in n:
            with connection.cursor() as cur:
                cur.execute(
                    'UPDATE cms_activity SET image_url=%s WHERE id=%s',
                    [url, activity.id]
                )
            print(f"  {activity.name} -> {url.split('/')[-1]}")
            break

print("\nDone!")
