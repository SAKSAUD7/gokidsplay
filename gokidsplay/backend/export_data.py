import os
import sys
import django

# Set UTF-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from django.core import management

# Export all data except users, permissions, contenttypes, and sessions
management.call_command(
    'dumpdata',
    '--natural-foreign',
    '--natural-primary',
    '--exclude=contenttypes',
    '--exclude=auth.Permission',
    '--exclude=sessions.Session',
    '--exclude=core.User',
    '--indent=2',
    '--output=data_export.json'
)

print("✅ Data exported successfully to data_export.json")
