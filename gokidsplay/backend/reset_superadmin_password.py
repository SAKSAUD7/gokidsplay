import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.core.models import User

# Reset password for superadmin
email = 'superadmin@ninja.com'
new_password = 'sak123'

try:
    user = User.objects.get(email=email)
    user.set_password(new_password)
    user.is_active = True  # Ensure account is active
    user.save()
    print(f"✅ Password reset successfully for {email}")
    print(f"New password: {new_password}")
    print(f"Is active: {user.is_active}")
    print(f"Is staff: {user.is_staff}")
    print(f"Is superuser: {user.is_superuser}")
except User.DoesNotExist:
    print(f"❌ User with email {email} does not exist")
except Exception as e:
    print(f"❌ Error: {e}")
