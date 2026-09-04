"""
Django management command to normalize image URLs in the database.

This command converts absolute URLs (with localhost, ports, domains) to relative paths
while ensuring file safety and providing comprehensive logging.

Usage:
    python manage.py normalize_images --dry-run  # Preview changes
    python manage.py normalize_images             # Execute normalization
"""

import os
import re
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from apps.cms.models import (
    Activity, Banner, Testimonial, GalleryItem, InstagramReel,
    PageSection, PartyPackage, FacilityItem
)


class Command(BaseCommand):
    help = 'Normalize image URLs from absolute to relative paths'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without modifying database',
        )

    def __init__(self):
        super().__init__()
        self.changes = []
        self.missing_files = []
        self.errors = []

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be saved'))
        
        self.stdout.write('Starting image URL normalization...\n')
        
        try:
            with transaction.atomic():
                # Normalize each model
                self.normalize_activities()
                self.normalize_banners()
                self.normalize_testimonials()
                self.normalize_gallery_items()
                self.normalize_instagram_reels()
                self.normalize_page_sections()
                self.normalize_party_packages()
                self.normalize_facility_items()
                
                if dry_run:
                    # Rollback transaction in dry-run mode
                    transaction.set_rollback(True)
                    self.stdout.write(self.style.WARNING('\nDRY RUN - Rolling back all changes'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\nError during normalization: {str(e)}'))
            self.errors.append(str(e))
        
        # Print summary
        self.print_summary(dry_run)
        
        # Write log file
        self.write_log_file(dry_run)

    def normalize_url(self, url):
        """
        Convert absolute URL to relative path.
        
        Examples:
            http://localhost:8080/media/uploads/img.jpg -> uploads/img.jpg
            http://localhost:8000/media/uploads/img.jpg -> uploads/img.jpg
            /media/uploads/img.jpg -> uploads/img.jpg
            uploads/img.jpg -> uploads/img.jpg (no change)
        """
        if not url:
            return url
        
        # Pattern to match absolute URLs
        patterns = [
            r'https?://[^/]+/media/(.+)',  # http://domain/media/path
            r'^/media/(.+)',                # /media/path
        ]
        
        for pattern in patterns:
            match = re.match(pattern, url)
            if match:
                return match.group(1)
        
        # If no pattern matches, return as-is (already relative or external URL)
        return url

    def file_exists(self, relative_path):
        """Check if file exists in MEDIA_ROOT"""
        if not relative_path:
            return False
        
        full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        return os.path.isfile(full_path)

    def should_normalize(self, url):
        """Check if URL needs normalization"""
        if not url:
            return False
        
        # Check if it's an absolute URL with localhost or /media/
        return bool(re.match(r'(https?://|/media/)', url))

    def log_change(self, model_name, field_name, record_id, old_value, new_value, file_exists):
        """Log a URL change"""
        self.changes.append({
            'model': model_name,
            'field': field_name,
            'id': record_id,
            'old': old_value,
            'new': new_value,
            'exists': file_exists
        })
        
        if not file_exists:
            self.missing_files.append({
                'model': model_name,
                'id': record_id,
                'field': field_name,
                'path': new_value
            })

    def normalize_activities(self):
        """Normalize Activity model image URLs"""
        self.stdout.write('\nProcessing Activities...')
        count = 0
        
        for activity in Activity.objects.all():
            # Normalize image_url
            if self.should_normalize(activity.image_url):
                old_url = activity.image_url
                new_url = self.normalize_url(old_url)
                exists = self.file_exists(new_url)
                
                activity.image_url = new_url
                activity.save()
                
                self.log_change('Activity', 'image_url', activity.id, old_url, new_url, exists)
                count += 1
            
            # Normalize gallery (JSON array of URLs)
            if activity.gallery:
                gallery_changed = False
                new_gallery = []
                
                for img_url in activity.gallery:
                    if self.should_normalize(img_url):
                        old_url = img_url
                        new_url = self.normalize_url(old_url)
                        exists = self.file_exists(new_url)
                        
                        new_gallery.append(new_url)
                        self.log_change('Activity', 'gallery', activity.id, old_url, new_url, exists)
                        gallery_changed = True
                    else:
                        new_gallery.append(img_url)
                
                if gallery_changed:
                    activity.gallery = new_gallery
                    activity.save()
                    count += 1
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Processed {count} activities'))

    def normalize_banners(self):
        """Normalize Banner model image URLs"""
        self.stdout.write('\nProcessing Banners...')
        count = 0
        
        for banner in Banner.objects.all():
            if self.should_normalize(banner.image_url):
                old_url = banner.image_url
                new_url = self.normalize_url(old_url)
                exists = self.file_exists(new_url)
                
                banner.image_url = new_url
                banner.save()
                
                self.log_change('Banner', 'image_url', banner.id, old_url, new_url, exists)
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Processed {count} banners'))

    def normalize_testimonials(self):
        """Normalize Testimonial model image URLs"""
        self.stdout.write('\nProcessing Testimonials...')
        count = 0
        
        for testimonial in Testimonial.objects.all():
            # Normalize image_url
            if testimonial.image_url and self.should_normalize(testimonial.image_url):
                old_url = testimonial.image_url
                new_url = self.normalize_url(old_url)
                exists = self.file_exists(new_url)
                
                testimonial.image_url = new_url
                testimonial.save()
                
                self.log_change('Testimonial', 'image_url', testimonial.id, old_url, new_url, exists)
                count += 1
            
            # Normalize thumbnail_url
            if testimonial.thumbnail_url and self.should_normalize(testimonial.thumbnail_url):
                old_url = testimonial.thumbnail_url
                new_url = self.normalize_url(old_url)
                exists = self.file_exists(new_url)
                
                testimonial.thumbnail_url = new_url
                testimonial.save()
                
                self.log_change('Testimonial', 'thumbnail_url', testimonial.id, old_url, new_url, exists)
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Processed {count} testimonials'))

    def normalize_gallery_items(self):
        """Normalize GalleryItem model image URLs"""
        self.stdout.write('\nProcessing Gallery Items...')
        count = 0
        
        for item in GalleryItem.objects.all():
            if self.should_normalize(item.image_url):
                old_url = item.image_url
                new_url = self.normalize_url(old_url)
                exists = self.file_exists(new_url)
                
                item.image_url = new_url
                item.save()
                
                self.log_change('GalleryItem', 'image_url', item.id, old_url, new_url, exists)
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Processed {count} gallery items'))

    def normalize_instagram_reels(self):
        """Normalize InstagramReel model thumbnail URLs"""
        self.stdout.write('\nProcessing Instagram Reels...')
        count = 0
        
        for reel in InstagramReel.objects.all():
            if self.should_normalize(reel.thumbnail_url):
                old_url = reel.thumbnail_url
                new_url = self.normalize_url(old_url)
                exists = self.file_exists(new_url)
                
                reel.thumbnail_url = new_url
                reel.save()
                
                self.log_change('InstagramReel', 'thumbnail_url', reel.id, old_url, new_url, exists)
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Processed {count} instagram reels'))

    def normalize_page_sections(self):
        """Normalize PageSection model image URLs"""
        self.stdout.write('\nProcessing Page Sections...')
        count = 0
        
        for section in PageSection.objects.all():
            if section.image_url and self.should_normalize(section.image_url):
                old_url = section.image_url
                new_url = self.normalize_url(old_url)
                exists = self.file_exists(new_url)
                
                section.image_url = new_url
                section.save()
                
                self.log_change('PageSection', 'image_url', section.id, old_url, new_url, exists)
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Processed {count} page sections'))

    def normalize_party_packages(self):
        """Normalize PartyPackage model image URLs"""
        self.stdout.write('\nProcessing Party Packages...')
        count = 0
        
        for package in PartyPackage.objects.all():
            if package.image_url and self.should_normalize(package.image_url):
                old_url = package.image_url
                new_url = self.normalize_url(old_url)
                exists = self.file_exists(new_url)
                
                package.image_url = new_url
                package.save()
                
                self.log_change('PartyPackage', 'image_url', package.id, old_url, new_url, exists)
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Processed {count} party packages'))

    def normalize_facility_items(self):
        """Normalize FacilityItem model image URLs"""
        self.stdout.write('\nProcessing Facility Items...')
        count = 0
        
        for facility in FacilityItem.objects.all():
            if facility.image_url and self.should_normalize(facility.image_url):
                old_url = facility.image_url
                new_url = self.normalize_url(old_url)
                exists = self.file_exists(new_url)
                
                facility.image_url = new_url
                facility.save()
                
                self.log_change('FacilityItem', 'image_url', facility.id, old_url, new_url, exists)
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Processed {count} facility items'))

    def print_summary(self, dry_run):
        """Print summary of changes"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('NORMALIZATION SUMMARY'))
        self.stdout.write('='*60)
        
        self.stdout.write(f'\nTotal URLs normalized: {len(self.changes)}')
        self.stdout.write(f'Missing files: {len(self.missing_files)}')
        self.stdout.write(f'Errors: {len(self.errors)}')
        
        if self.missing_files:
            self.stdout.write(self.style.WARNING('\nMISSING FILES:'))
            for missing in self.missing_files[:10]:  # Show first 10
                self.stdout.write(f"  - {missing['model']} #{missing['id']}: {missing['path']}")
            
            if len(self.missing_files) > 10:
                self.stdout.write(f"  ... and {len(self.missing_files) - 10} more (see log file)")
        
        if self.errors:
            self.stdout.write(self.style.ERROR('\nERRORS:'))
            for error in self.errors:
                self.stdout.write(f"  - {error}")

    def write_log_file(self, dry_run):
        """Write detailed log file"""
        log_path = os.path.join(settings.BASE_DIR, 'image_normalization_log.txt')
        
        with open(log_path, 'w', encoding='utf-8') as f:
            f.write('IMAGE URL NORMALIZATION LOG\n')
            f.write('='*60 + '\n')
            f.write(f'Mode: {"DRY RUN" if dry_run else "LIVE"}\n')
            f.write(f'Total changes: {len(self.changes)}\n')
            f.write(f'Missing files: {len(self.missing_files)}\n\n')
            
            f.write('CHANGES:\n')
            f.write('-'*60 + '\n')
            for change in self.changes:
                status = '✓' if change['exists'] else '✗ MISSING'
                f.write(f"{status} {change['model']}.{change['field']} (ID: {change['id']})\n")
                f.write(f"  OLD: {change['old']}\n")
                f.write(f"  NEW: {change['new']}\n\n")
            
            if self.missing_files:
                f.write('\nMISSING FILES:\n')
                f.write('-'*60 + '\n')
                for missing in self.missing_files:
                    f.write(f"{missing['model']} #{missing['id']} - {missing['field']}\n")
                    f.write(f"  Path: {missing['path']}\n\n")
        
        self.stdout.write(f'\nLog file written to: {log_path}')
