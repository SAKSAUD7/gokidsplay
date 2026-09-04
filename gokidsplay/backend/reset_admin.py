import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

User = get_user_model()
email = 'myadmin@ninjapark.com'
password = 'admin123'

try:
    user = User.objects.get(email=email)
    print(f"User found: {user.email}")
    print(f"Is active: {user.is_active}")
    print(f"Is superuser: {user.is_superuser}")
    print(f"Is staff: {user.is_staff}")
    
    # Reset password to ensure it's correct
    user.set_password(password)
    user.save()
    print(f"Password reset to '{password}' successfully.")
    
except User.DoesNotExist:
    print(f"User {email} NOT FOUND. Creating now...")
    User.objects.create_superuser(
        email=email,
        password=password,
        name='Admin',
        username='myadmin'
    )
    print(f"User {email} created successfully.")
except Exception as e:
    print(f"Error: {e}")
