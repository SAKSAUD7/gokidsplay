from django.core.management.base import BaseCommand
from apps.cms.models import InstagramReel

class Command(BaseCommand):
    help = 'Populates the database with initial Instagram reels'

    def handle(self, *args, **kwargs):
        self.stdout.write('Populating Instagram reels...')
        
        # Clear existing reels
        InstagramReel.objects.all().delete()
        
        reels_data = [
            {
                'title': 'Ninja Fun 1',
                'thumbnail_url': '/images/instagram/reel-1.jpg',
                'reel_url': 'https://www.instagram.com/reel/1/',
                'order': 1
            },
            {
                'title': 'Ninja Fun 2',
                'thumbnail_url': '/images/instagram/reel-2.jpg',
                'reel_url': 'https://www.instagram.com/reel/2/',
                'order': 2
            },
            {
                'title': 'Ninja Fun 4',
                'thumbnail_url': '/images/instagram/reel-4.jpg',
                'reel_url': 'https://www.instagram.com/reel/4/',
                'order': 3
            },
            {
                'title': 'Ninja Fun 5',
                'thumbnail_url': '/images/instagram/reel-5.jpg',
                'reel_url': 'https://www.instagram.com/reel/5/',
                'order': 4
            }
        ]
        
        for data in reels_data:
            InstagramReel.objects.create(**data)
            
        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(reels_data)} Instagram reels'))
