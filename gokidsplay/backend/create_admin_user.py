import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.core.models import User

# Admin credentials
email = 'admin@example.com'
password = 'admin123'  # Changed from 'admin' to 'admin123'

# Check if admin exists
if User.objects.filter(email=email).exists():
    print(f"✅ Admin user '{email}' already exists")
    # Update password just in case
    user = User.objects.get(email=email)
    user.set_password(password)
    user.save()
    print(f"✅ Password updated for '{email}'")
else:
    # Create admin user
    User.objects.create_superuser(
        email=email,
        password=password,
        name='Admin User'
    )
    print(f"✅ Created admin user: {email}")

print(f"\n🔑 Login Credentials:")
print(f"   Email: {email}")
print(f"   Password: {password}")
