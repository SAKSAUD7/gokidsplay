"""
Populate SpinPin About Page Content
This script adds SpinPin-specific content for the About page including:
- Hero section
- Story section  
- Timeline items
- Value items
- Stats
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.cms.models import PageSection, TimelineItem, ValueItem, StatCard

def populate_about_content():
    print("Populating SpinPin About Page Content...")
    
    # Hero Section
    hero, created = PageSection.objects.update_or_create(
        page='about',
        section_key='hero',
        defaults={
            'title': 'About Spin Pin Leicester',
            'content': "Leicester's Premier Entertainment Destination for Bowling, Skating & Gaming",
            'active': True,
            'order': 1
        }
    )
    print(f"{'Created' if created else 'Updated'} About Hero section")
    
    # Story Section
    story, created = PageSection.objects.update_or_create(
        page='about',
        section_key='story',
        defaults={
            'title': 'Our Story',
            'content': """Welcome to Spin Pin Leicester, your ultimate destination for fun and entertainment in the heart of Leicester!

We are proud to be home to Leicester's first and only roller skating rink, alongside our state-of-the-art ten pin bowling lanes and exciting arcade games. Whether you're looking for a fun day out with family, a unique date night, or an action-packed party venue, Spin Pin has something for everyone.

Our mission is simple: to create unforgettable memories through quality entertainment in a safe, welcoming environment. From our special themed skating sessions to competitive bowling leagues, we're dedicated to bringing joy to the Leicester community.

Located at Ramdoot House on Navigation Street, we're easily accessible and offer convenient parking facilities. Our friendly staff are always ready to ensure you have the best possible experience, whether it's your first visit or you're a regular guest.

Join us at Spin Pin Leicester - where fun never stops rolling!""",
            'active': True,
            'order': 2
        }
    )
    print(f"{'Created' if created else 'Updated'} About Story section")
    
    # Timeline Items
    timeline_data = [
        {
            'year': 2023,
            'title': 'Grand Opening',
            'description': 'Spin Pin Leicester opens its doors as the city\'s first roller skating rink, bringing a new era of entertainment to Leicester.',
            'order': 1
        },
        {
            'year': 2023,
            'title': 'Bowling Lanes Launch',
            'description': 'Added state-of-the-art ten pin bowling lanes with the latest scoring technology and comfortable seating areas.',
            'order': 2
        },
        {
            'year': 2024,
            'title': 'Arcade Expansion',
            'description': 'Expanded our entertainment offerings with a modern arcade featuring VR gaming and classic favorites.',
            'order': 3
        },
        {
            'year': 2024,
            'title': 'Special Sessions',
            'description': 'Launched themed skating sessions including Teen Tribe, Grown-up Glide, and Grand Disco nights.',
            'order': 4
        }
    ]
    
    for item_data in timeline_data:
        item, created = TimelineItem.objects.update_or_create(
            year=item_data['year'],
            title=item_data['title'],
            defaults={
                'description': item_data['description'],
                'order': item_data['order'],
                'active': True
            }
        )
        print(f"{'Created' if created else 'Updated'} Timeline: {item.title}")
    
    # Value Items
    values_data = [
        {
            'title': 'Family-Friendly Fun',
            'description': 'We create a welcoming environment where families can enjoy quality time together, with activities suitable for all ages.',
            'icon': 'Users',
            'order': 1
        },
        {
            'title': 'Safety First',
            'description': 'Your safety is our priority. All our equipment is regularly maintained and our staff are trained to ensure a secure environment.',
            'icon': 'Shield',
            'order': 2
        },
        {
            'title': 'Community Focus',
            'description': 'We\'re proud to be part of the Leicester community, hosting local events and supporting community initiatives.',
            'icon': 'Heart',
            'order': 3
        },
        {
            'title': 'Quality Experience',
            'description': 'From our modern facilities to our friendly service, we\'re committed to providing an exceptional experience every visit.',
            'icon': 'Star',
            'order': 4
        }
    ]
    
    for value_data in values_data:
        value, created = ValueItem.objects.update_or_create(
            title=value_data['title'],
            defaults={
                'description': value_data['description'],
                'icon': value_data['icon'],
                'order': value_data['order'],
                'active': True
            }
        )
        print(f"{'Created' if created else 'Updated'} Value: {value.title}")
    
    # Stats for About Page
    stats_data = [
        {
            'page': 'about',
            'label': 'Happy Customers',
            'value': '10,000+',
            'icon': 'Users',
            'order': 1
        },
        {
            'page': 'about',
            'label': 'Bowling Lanes',
            'value': '8',
            'icon': 'Target',
            'order': 2
        },
        {
            'page': 'about',
            'label': 'Skating Rink',
            'value': "Leicester's 1st",
            'icon': 'Zap',
            'order': 3
        },
        {
            'page': 'about',
            'label': 'Years of Fun',
            'value': '1+',
            'icon': 'Calendar',
            'order': 4
        }
    ]
    
    for stat_data in stats_data:
        stat, created = StatCard.objects.update_or_create(
            page=stat_data['page'],
            label=stat_data['label'],
            defaults={
                'value': stat_data['value'],
                'icon': stat_data['icon'],
                'order': stat_data['order'],
                'active': True
            }
        )
        print(f"{'Created' if created else 'Updated'} Stat: {stat.label}")
    
    print("\n✅ About page content population complete!")

if __name__ == '__main__':
    populate_about_content()
