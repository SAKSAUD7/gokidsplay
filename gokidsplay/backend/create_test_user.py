from apps.core.models import User

# Create or update test user
email = "test@ninjapark.com"
password = "testpass123"

try:
    user = User.objects.get(email=email)
    print(f"User {email} already exists")
except User.DoesNotExist:
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        name="Test Admin",
        role="SUPER_ADMIN",
        is_superuser=True,
        is_staff=True
    )
    print(f"Created user: {email}")

# Set password again to be sure
user.set_password(password)
user.save()
print(f"Password set for {email}")
print(f"User details: role={user.role}, is_superuser={user.is_superuser}, is_staff={user.is_staff}")
