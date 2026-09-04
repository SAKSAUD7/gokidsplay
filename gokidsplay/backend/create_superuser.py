import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.core.models import User

# Create superuser
users_to_create = [
    {'role': 'ADMIN', 'email': 'admin2@ninjapark.com', 'name': 'Admin Two', 'is_superuser': True},
    {'role': 'MANAGER', 'email': 'manager@ninjapark.com', 'name': 'Park Manager', 'is_superuser': False},
    {'role': 'CONTENT_MANAGER', 'email': 'content@ninjapark.com', 'name': 'Content Manager', 'is_superuser': False},
    {'role': 'STAFF', 'email': 'staff@ninjapark.com', 'name': 'Front Desk Staff', 'is_superuser': False},
    {'role': 'EMPLOYEE', 'email': 'employee@ninjapark.com', 'name': 'General Employee', 'is_superuser': False},
]

default_password = 'NinjaPark2026!'

# Create original admin if missing
if not User.objects.filter(email='admin@ninjapark.com').exists():
    User.objects.create_superuser(username='admin', email='admin@ninjapark.com', password='admin123')
    print("✅ Superuser 'admin' created")

for user_data in users_to_create:
    email = user_data['email']
    if not User.objects.filter(email=email).exists():
        user = User.objects.create_user(
            username=email.split('@')[0],
            email=email,
            password=default_password,
            name=user_data['name'],
            role=user_data['role']
        )
        if user_data['is_superuser']:
            user.is_superuser = True
            user.is_staff = True
            user.save()
        
        print(f"✅ User created: {user_data['role']} - {email}")
    else:
        print(f"⚠️ User already exists: {email}")

print("\n=== RBAC Credentials ===")
print(f"Password for all new users: {default_password}")
print("1. Admin: admin@ninjapark.com / admin123")
print("2. Admin 2: admin2@ninjapark.com")
print("3. Manager: manager@ninjapark.com")
print("4. Content: content@ninjapark.com")
print("5. Staff: staff@ninjapark.com")
print("6. Employee: employee@ninjapark.com")
