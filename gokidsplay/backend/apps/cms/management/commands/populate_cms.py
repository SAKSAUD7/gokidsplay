from django.core.management.base import BaseCommand
from apps.cms.models import (
    Page, PageSection, Banner, Activity, Faq, Testimonial, 
    SocialLink, ContactInfo, PricingPlan, PartyPackage, 
    GroupPackage, GuidelineCategory, LegalDocument, 
    StatCard, InstagramReel, MenuSection, TimelineItem, 
    ValueItem, FacilityItem
)

class Command(BaseCommand):
    help = 'Populates the CMS with initial data from hardcoded content'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting CMS population...')

        # 1. Create Pages
        pages_data = [
            {'slug': 'home', 'title': 'Ninja Inflatable Park - Home', 'description': 'Welcome to the ultimate inflatable park experience!'},
            {'slug': 'about', 'title': 'About Us - Ninja Inflatable Park', 'description': 'Learn about our story and mission.'},
            {'slug': 'pricing', 'title': 'Pricing - Ninja Inflatable Park', 'description': 'Check our session and party prices.'},
            {'slug': 'parties', 'title': 'Parties - Ninja Inflatable Park', 'description': 'Book the best birthday party ever!'},
            {'slug': 'attractions', 'title': 'Attractions - Ninja Inflatable Park', 'description': 'Explore our amazing inflatable attractions.'},
            {'slug': 'contact', 'title': 'Contact Us - Ninja Inflatable Park', 'description': 'Get in touch with us.'},
            {'slug': 'facilities', 'title': 'Facilities - Ninja Inflatable Park', 'description': 'Our park facilities and amenities.'},
            {'slug': 'groups', 'title': 'Group Bookings - Ninja Inflatable Park', 'description': 'Special rates for schools and large groups.'},
            {'slug': 'guidelines', 'title': 'Safety Guidelines - Ninja Inflatable Park', 'description': 'Important safety rules and guidelines.'},
            {'slug': 'privacy', 'title': 'Privacy Policy - Ninja Inflatable Park', 'description': 'Our privacy policy.'},
            {'slug': 'waiver-terms', 'title': 'Waiver Terms - Ninja Inflatable Park', 'description': 'Terms and conditions for waivers.'},
        ]

        for p in pages_data:
            Page.objects.update_or_create(
                slug=p['slug'],
                defaults={'title': p['title'], 'description': p['description']}
            )
        self.stdout.write(self.style.SUCCESS(f'Created/Updated {len(pages_data)} pages'))

        # 2. Create Banners (Sample)
        banners_data = [
            {
                'title': 'Welcome to Ninja Park',
                'image_url': 'https://images.unsplash.com/photo-1575206950284-073c68383e98?q=80&w=2070',
                'link': '/book',
                'order': 1
            },
            {
                'title': 'Book Your Party',
                'image_url': 'https://images.unsplash.com/photo-1530103862676-de3c9a59af38?q=80&w=2070',
                'link': '/parties',
                'order': 2
            }
        ]
        for b in banners_data:
            Banner.objects.update_or_create(
                title=b['title'],
                defaults=b
            )
        self.stdout.write(self.style.SUCCESS(f'Created/Updated {len(banners_data)} banners'))

        # 3. Create Contact Info (Sample)
        contact_data = [
            {'key': 'main_phone', 'label': 'Phone', 'value': '+1 (555) 123-4567', 'category': 'PHONE', 'icon': 'Phone'},
            {'key': 'main_email', 'label': 'Email', 'value': 'info@ninjapark.com', 'category': 'EMAIL', 'icon': 'Mail'},
            {'key': 'main_address', 'label': 'Address', 'value': '123 Ninja Way, Fun City, FC 12345', 'category': 'ADDRESS', 'icon': 'MapPin'},
        ]
        for c in contact_data:
            ContactInfo.objects.update_or_create(
                key=c['key'],
                defaults=c
            )
        self.stdout.write(self.style.SUCCESS(f'Created/Updated {len(contact_data)} contact info items'))

        # 4. Create Page Sections (Sample - Hero for Home)
        sections_data = [
            {
                'page': 'home',
                'section_key': 'hero',
                'title': 'Unleash Your Inner Ninja',
                'subtitle': 'The biggest inflatable park in the city!',
                'cta_text': 'Book Now',
                'cta_link': '/book'
            },
            {
                'page': 'about',
                'section_key': 'hero',
                'title': 'Our Story',
                'subtitle': 'Creating fun since 2020',
            }
        ]
        for s in sections_data:
            PageSection.objects.update_or_create(
                page=s['page'],
                section_key=s['section_key'],
                defaults=s
            )
        self.stdout.write(self.style.SUCCESS(f'Created/Updated {len(sections_data)} page sections'))

        self.stdout.write(self.style.SUCCESS('CMS Population Complete!'))
