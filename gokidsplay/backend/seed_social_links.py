"""Fix social links seed - SocialLink model has no 'name' field, only platform/url/icon."""
import os, sys, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ninja_backend.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.cms.models import SocialLink

SOCIALS = [
    ("instagram", "https://instagram.com/gokidsplayleicester", "instagram"),
    ("facebook",  "https://facebook.com/gokidsplayleicester",  "facebook"),
    ("tiktok",    "https://tiktok.com/@gokidsplayleicester",   "tiktok"),
    ("twitter",   "https://twitter.com/gokidsplayleicester",   "twitter"),
]

for platform, url, icon in SOCIALS:
    obj, created = SocialLink.objects.update_or_create(
        platform=platform,
        defaults={"url": url, "icon": icon, "active": True}
    )
    action = "CREATED" if created else "UPDATED"
    print(f"  [{action}] {platform} -> {url}")

print("Social links done!")
