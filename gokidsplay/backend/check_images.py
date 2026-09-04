import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.cms.models import Activity  # Assuming 'Attractions' are 'Activity' model based on previous file exploration

print("\n=== Attraction/Activity Image Paths ===")
try:
    activities = Activity.objects.all()[:5]
    if not activities:
        print("No activities found.")
    for activity in activities:
        print(f"Name: {activity.title}")
        print(f"Image Field: {activity.image}")
        print(f"Image URL (model property): {activity.image.url if activity.image else 'No Image'}")
        print("-" * 30)
except Exception as e:
    print(f"Error accessing Activity model: {e}")
    # Fallback to checking tables if model name is wrong
    from django.apps import apps
    for model in apps.get_models():
        if 'attract' in model.__name__.lower() or 'activ' in model.__name__.lower():
            print(f"Found candidate model: {model.__name__}")

print("\n=== Media Directory Check ===")
media_root = django.conf.settings.MEDIA_ROOT
print(f"Media Root: {media_root}")
if os.path.exists(media_root):
    print("Media directory exists.")
    print("Top level content:", os.listdir(media_root))
else:
    print("Media directory DOES NOT exist.")
