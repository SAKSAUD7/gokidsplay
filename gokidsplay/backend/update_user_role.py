import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.core.models import User

# Update user role to SUPERADMIN
email = 'admin@ninjapark.com'

try:
    user = User.objects.get(email=email)
    
    # Print current status
    print(f"Current user: {user.email}")
    print(f"Current role: {user.role}")
    print(f"Is staff: {user.is_staff}")
    print(f"Is superuser: {user.is_superuser}")
    print()
    
    # Update to ADMIN role (highest role in the system)
    user.role = 'ADMIN'
    user.is_staff = True
    user.is_superuser = True
    user.save()
    
    print(f"✅ User role updated successfully!")
    print(f"New role: {user.role}")
    print(f"Is staff: {user.is_staff}")
    print(f"Is superuser: {user.is_superuser}")
    
except User.DoesNotExist:
    print(f"❌ User with email {email} does not exist")
except Exception as e:
    print(f"❌ Error: {e}")
