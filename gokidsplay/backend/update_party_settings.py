"""
Update PartyBookingConfig with SpinPin party availability days.
Run: python update_party_settings.py (from backend/ folder)
"""
import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.cms.models import PartyBookingConfig

config, created = PartyBookingConfig.objects.get_or_create(id=1)
config.available_time_slots = "Thursday to Sunday"
config.save()
action = "CREATED" if created else "UPDATED"
print(f"[{action}] PartyBookingConfig: available_time_slots = '{config.available_time_slots}'")
print("Done!")
