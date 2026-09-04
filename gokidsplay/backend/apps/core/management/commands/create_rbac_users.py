from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create RBAC users for testing and deployment'

    def handle(self, *args, **options):
        users_to_create = [
            {
                'email': 'admin2@ninjapark.com',
                'username': 'admin2',
                'name': 'Admin Two',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True
            },
            {
                'email': 'manager@ninjapark.com',
                'username': 'manager',
                'name': 'Park Manager',
                'role': 'MANAGER',
                'is_staff': True,
                'is_superuser': False
            },
            {
                'email': 'content@ninjapark.com',
                'username': 'content',
                'name': 'Content Manager',
                'role': 'CONTENT_MANAGER',
                'is_staff': True,
                'is_superuser': False
            },
            {
                'email': 'staff@ninjapark.com',
                'username': 'staff',
                'name': 'Front Desk Staff',
                'role': 'STAFF',
                'is_staff': True,
                'is_superuser': False
            },
            {
                'email': 'employee@ninjapark.com',
                'username': 'employee',
                'name': 'General Employee',
                'role': 'EMPLOYEE',
                'is_staff': True,
                'is_superuser': False
            },
        ]

        password = 'NinjaPark2026!'
        created_count = 0
        skipped_count = 0

        for user_data in users_to_create:
            email = user_data['email']
            
            if User.objects.filter(email=email).exists():
                self.stdout.write(
                    self.style.WARNING(f'User {email} already exists, skipping...')
                )
                skipped_count += 1
                continue

            user = User.objects.create_user(
                username=user_data['username'],
                email=email,
                password=password,
                name=user_data['name'],
                role=user_data['role']
            )
            
            user.is_staff = user_data['is_staff']
            user.is_superuser = user_data['is_superuser']
            user.save()

            self.stdout.write(
                self.style.SUCCESS(f'✓ Created user: {email} (Role: {user_data["role"]})')
            )
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\n=== Summary ===\n'
                f'Created: {created_count} users\n'
                f'Skipped: {skipped_count} users (already exist)\n'
                f'Password for all new users: {password}'
            )
        )
