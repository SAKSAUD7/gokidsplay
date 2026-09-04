"""
Management command to fix employee user permissions by setting is_staff=True
"""
from django.core.management.base import BaseCommand
from apps.core.models import User


class Command(BaseCommand):
    help = 'Set is_staff=True for all employee users to enable admin panel access'

    def handle(self, *args, **options):
        # Find all users with employee-related roles
        employee_users = User.objects.filter(
            role__in=['STAFF', 'EMPLOYEE', 'MANAGER', 'CONTENT_MANAGER']
        )
        
        updated_count = 0
        for user in employee_users:
            if not user.is_staff:
                user.is_staff = True
                user.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Set is_staff=True for {user.email} (role: {user.role})')
                )
        
        if updated_count == 0:
            self.stdout.write(
                self.style.WARNING('No users needed updating. All employee users already have is_staff=True')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\n✓ Successfully updated {updated_count} employee user(s)')
            )
        
        # Show summary
        total_staff = User.objects.filter(is_staff=True, is_superuser=False).count()
        total_superusers = User.objects.filter(is_superuser=True).count()
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'Summary:'))
        self.stdout.write(f'  Superusers: {total_superusers}')
        self.stdout.write(f'  Staff/Employees: {total_staff}')
        self.stdout.write('='*50)
