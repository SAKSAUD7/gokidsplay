import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.core.models import User

print("\n=== Existing Users ===")
for user in User.objects.all():
    print(f"Email: {user.email} | Username: {user.username} | Is Superuser: {user.is_superuser} | Is Staff: {user.is_staff}")

# Create your new superuser if it doesn't exist
username = 'myadmin'
email = 'myadmin@ninjapark.com'
password = 'admin123'

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(username=username, email=email, password=password, name='My Admin')
    print(f"\n✅ New superuser created!")
    print(f"Email: {email}")
    print(f"Password: {password}")
else:
    print(f"\n⚠️ User with email '{email}' already exists")
