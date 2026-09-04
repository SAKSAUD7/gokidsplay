from django.core.management.base import BaseCommand
from django.core.files import File
from apps.core.models import Logo
import os

class Command(BaseCommand):
    help = 'Add existing logo to the database'

    def handle(self, *args, **kwargs):
        # Get the base directory (where manage.py is)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
        # Go up one more level to get to the project root
        project_root = os.path.dirname(base_dir)
        logo_path = os.path.join(project_root, 'frontend', 'public', 'logo_transparent.png')
        
        self.stdout.write(f'Looking for logo at: {logo_path}')
        
        if not os.path.exists(logo_path):
            self.stdout.write(self.style.ERROR(f'Logo file not found at: {logo_path}'))
            return
        
        # Check if a logo already exists
        if Logo.objects.exists():
            self.stdout.write(self.style.WARNING('Logo already exists in database. Skipping.'))
            return
        
        # Create the logo entry
        with open(logo_path, 'rb') as f:
            logo = Logo.objects.create(
                name='Ninja Inflatable Park Logo',
                is_active=True
            )
            logo.image.save('logo_transparent.png', File(f), save=True)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully added logo: {logo.name}'))
        self.stdout.write(self.style.SUCCESS(f'Logo ID: {logo.id}'))
        self.stdout.write(self.style.SUCCESS(f'Active: {logo.is_active}'))
