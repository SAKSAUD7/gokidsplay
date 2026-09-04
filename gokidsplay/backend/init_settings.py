import os
import django
import sys

# Add project root to path
sys.path.append(os.getcwd())

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ninja_backend.settings")
django.setup()

from apps.core.models import GlobalSettings

def init_settings():
    try:
        if not GlobalSettings.objects.exists():
            print("Creating default Global Settings...")
            GlobalSettings.objects.create(
                park_name="Ninja Inflatable Park",
                contact_email="admin@ninjapark.com",
                hero_title="Experience the Ultimate Bounce!",
                hero_subtitle="The biggest inflatable park in the city",
                online_booking_enabled=True
            )
            print("Default Global Settings created successfully.")
        else:
            print("Global Settings already exist. No action needed.")
    except Exception as e:
        print(f"Error initializing settings: {e}")

if __name__ == "__main__":
    init_settings()
