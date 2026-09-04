from django.core.management.base import BaseCommand
from apps.core.models import User

class Command(BaseCommand):
    help = 'Create test admin user'

    def handle(self, *args, **options):
        email = "test@ninjapark.com"
        password = "testpass123"

        try:
            user = User.objects.get(email=email)
            self.stdout.write(f"User {email} already exists")
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
            self.stdout.write(self.style.SUCCESS(f"Created user: {email}"))

        # Set password again to be sure
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Password set for {email}"))
        self.stdout.write(f"User details: role={user.role}, is_superuser={user.is_superuser}, is_staff={user.is_staff}")
