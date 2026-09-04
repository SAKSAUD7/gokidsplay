import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')

django.setup()

from django.contrib.auth import get_user_model

def create_admin_user():
    User = get_user_model()
    email = 'admin@spinpin.com'
    password = 'admin123'
    name = 'Super Admin'

    print("=" * 50)
    print("USER CREATION SCRIPT")
    print("=" * 50)

    try:
        if not User.objects.filter(email=email).exists():
            print(f"Creating superuser {email}...")
            # Using create_superuser which handles password hashing
            # Ensure required fields are provided if needed
            User.objects.create_superuser(
                email=email, 
                username=email, # Some custom user models still use username field under the hood
                password=password, 
                name=name
            )
            print(f"✅ Superuser created successfully!")
            print(f"Email: {email}")
            print(f"Password: {password}")
        else:
            print(f"User {email} already exists.")
            print("Resetting password...")
            u = User.objects.get(email=email)
            u.set_password(password)
            u.save()
            print(f"✅ Password reset to: {password}")
            
    except Exception as e:
        print(f"❌ Error creating/updating user: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_admin_user()
