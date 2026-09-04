import os
import django
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

User = get_user_model()
email = 'myadmin@ninjapark.com'
password = 'admin123'

print(f"--- Debugging Auth for {email} ---")
print(f"AUTH_USER_MODEL: {settings.AUTH_USER_MODEL}")
print(f"AUTHENTICATION_BACKENDS: {settings.AUTHENTICATION_BACKENDS}")

try:
    user = User.objects.get(email=email)
    print(f"\nUser Found: {user}")
    print(f"  ID: {user.id}")
    print(f"  Email: {user.email}")
    print(f"  Username (Django field): {user.username}")
    print(f"  Is Active: {user.is_active}")
    print(f"  Password Check: {user.check_password(password)}")
except User.DoesNotExist:
    print("\nCRITICAL: User not found in DB!")

print("\n--- Testing authenticate() ---")
# Test 1: Standard username kwarg (often mapped to email in custom models)
auth1 = authenticate(username=email, password=password)
print(f"1. authenticate(username='{email}'): {'SUCCESS' if auth1 else 'FAILED'}")

# Test 2: Email kwarg (for custom backends that explicitly want email)
auth2 = authenticate(email=email, password=password)
print(f"2. authenticate(email='{email}'): {'SUCCESS' if auth2 else 'FAILED'}")
