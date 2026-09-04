from django.core.management.base import BaseCommand
from apps.cms.models import (
    Activity, PricingPlan, Faq, StatCard, ValueItem, 
    TimelineItem, PartyPackage, PageSection, Page
)

class Command(BaseCommand):
    help = 'Restores legacy content from the previous website version'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting legacy content restoration...')
        
        # 1. Activities
        activities_data = [
            {
                "name": "Ninja Warrior Course",
                "description": "Test your agility and strength on our epic ninja warrior obstacle course. Swing, climb, and conquer!",
                "image_url": "/images/uploads/img-1.jpg",
                "order": 1
            },
            {
                "name": "Giant Slides",
                "description": "Experience the thrill of our massive inflatable slides. Perfect for speed demons and adrenaline junkies!",
                "image_url": "/images/uploads/img-2.jpg",
                "order": 2
            },
            {
                "name": "Wipeout Zone",
                "description": "Navigate through spinning obstacles and bouncing challenges. Can you make it across without falling?",
                "image_url": "/images/uploads/img-3.jpg",
                "order": 3
            },
            {
                "name": "Bounce Arena",
                "description": "Jump, flip, and bounce to your heart's content in our massive bounce arena. Fun for all ages!",
                "image_url": "/images/uploads/img-4.jpg",
                "order": 4
            },
            {
                "name": "Obstacle Challenge",
                "description": "Race through tunnels, climb walls, and dodge obstacles in this action-packed challenge course!",
                "image_url": "/images/uploads/img-5.jpg",
                "order": 5
            },
            {
                "name": "Mega Slides",
                "description": "Our tallest and fastest slides for the ultimate sliding experience. Hold on tight!",
                "image_url": "/images/uploads/img-6.jpg",
                "order": 6
            },
            {
                "name": "Jump Zone",
                "description": "Dedicated jumping area with trampolines and soft landing zones. Perfect for practicing tricks!",
                "image_url": "/images/uploads/img-7.jpg",
                "order": 7
            },
            {
                "name": "Toddler Zone",
                "description": "Safe and fun area designed specifically for our youngest ninjas aged 1-7 years.",
                "image_url": "/images/uploads/img-8.jpg",
                "order": 8
            },
            {
                "name": "Climbing Walls",
                "description": "Scale our inflatable climbing walls and reach new heights! Multiple difficulty levels available.",
                "image_url": "/images/uploads/img-9.png",
                "order": 9
            },
            {
                "name": "Party Zones",
                "description": "Private party areas perfect for birthdays and celebrations. Make your special day unforgettable!",
                "image_url": "/images/uploads/img-10.jpg",
                "order": 10
            },
            {
                "name": "Adventure Park",
                "description": "Explore our adventure-themed inflatable park with multiple zones and challenges to discover!",
                "image_url": "/images/hero-background.jpg",
                "order": 11
            }
        ]

        self.stdout.write(f'Restoring {len(activities_data)} activities...')
        Activity.objects.all().delete() # Clear existing to avoid dupes/conflicts
        for item in activities_data:
            Activity.objects.create(
                name=item['name'],
                description=item['description'],
                image_url=item['image_url'],
                active=True,
                order=item['order']
            )

        # 2. Pricing Plans
        pricing_data = [
            {
                "name": "Little Ninjas",
                "age_group": "Ages 1 - 7 Years",
                "price": 500,
                "duration": 60,  # Integer minutes
                "period_text": "/ 60 Mins",
                "features": [
                    "Full Access to Kids Zones",
                    "Safe & Supervised Area",
                    "Parental Supervision Required",
                    "+ GST Applicable"
                ],
                "type": "SESSION",
                "variant": "secondary",
                "popular": False,
                "order": 1
            },
            {
                "name": "Ninja Warriors",
                "age_group": "Ages 7+ Years",
                "price": 899,
                "duration": 60,
                "period_text": "/ 60 Mins",
                "features": [
                    "Access to All Attractions",
                    "Ninja Obstacle Course",
                    "Giant Slides & Wipeout",
                    "+ GST Applicable"
                ],
                "type": "SESSION",
                "variant": "primary",
                "popular": True,
                "order": 2
            },
            {
                "name": "Spectator",
                "age_group": "Guardians / Parents",
                "price": 150,
                "duration": 0,  # No specific duration
                "period_text": "/ Session",
                "features": [
                    "Entry to Park Premises",
                    "Café Access",
                    "Designated Seating Areas",
                    "+ GST Applicable"
                ],
                "type": "SESSION",
                "variant": "accent",
                "popular": False,
                "order": 3
            }
        ]
        
        self.stdout.write(f'Restoring {len(pricing_data)} pricing plans...')
        PricingPlan.objects.all().delete()
        for item in pricing_data:
            PricingPlan.objects.create(
                name=item['name'],
                age_group=item.get('age_group'),
                price=item['price'],
                duration=item['duration'],
                period_text=item['period_text'],
                features=item['features'],
                type=item['type'],
                variant=item['variant'],
                popular=item['popular'],
                active=True,
                order=item['order']
            )

        # 3. FAQs
        faqs_data = [
            { "question": "What age groups can enjoy Ninja Park?", "answer": "We have zones for everyone! From a dedicated toddler area to challenging courses for teens and adults. It's truly All Ages, All Fun.", "category": "General" },
            { "question": "Do I need to book in advance?", "answer": "We highly recommend booking online to secure your slot, especially on weekends. Walk-ins are subject to availability.", "category": "Booking" },
            { "question": "What should I wear?", "answer": "Comfortable athletic wear is best. Socks are MANDATORY for hygiene and safety. We sell grip socks at the counter if you need them.", "category": "General" },
            { "question": "Is the park safe for children?", "answer": "Absolutely! We have a 100% safety record. Our equipment is top-tier, and trained marshals supervise all zones.", "category": "Safety" },
            { "question": "Can I host a birthday party here?", "answer": "Yes! We specialize in unforgettable birthday bashes. Check out our Parties page for packages.", "category": "Events" },
        ]

        self.stdout.write(f'Restoring {len(faqs_data)} FAQs...')
        Faq.objects.all().delete()
        for i, item in enumerate(faqs_data):
            Faq.objects.create(
                question=item['question'],
                answer=item['answer'],
                category=item['category'],
                active=True,
                order=i+1
            )

        # 4. Stats
        stats_data = [
            { "label": "Sq Ft of Fun", "value": "20,000+", "page": "about" },
            { "label": "Happy Ninjas", "value": "50,000+", "page": "about" },
            { "label": "Unique Zones", "value": "11+", "page": "about" },
            { "label": "Safety Record", "value": "100%", "page": "about" },
        ]

        self.stdout.write(f'Restoring {len(stats_data)} stats...')
        StatCard.objects.all().delete()
        for i, item in enumerate(stats_data):
            StatCard.objects.create(
                label=item['label'],
                value=item['value'],
                page=item['page'],
                active=True,
                order=i+1
            )
            
        # 5. Values
        values_data = [
            { "title": "Fun First", "description": "Every decision we make is centered around creating maximum fun and joy for our guests." },
            { "title": "Safety Always", "description": "Your safety is our top priority. Trained staff, quality equipment, and strict protocols." },
            { "title": "Inclusive", "description": "Activities for all ages and abilities. Everyone deserves to feel like a ninja!" },
            { "title": "Excellence", "description": "We strive for excellence in every aspect, from cleanliness to customer service." },
        ]
        
        self.stdout.write(f'Restoring {len(values_data)} value items...')
        ValueItem.objects.all().delete()
        for i, item in enumerate(values_data):
            ValueItem.objects.create(
                title=item['title'],
                description=item['description'],
                active=True,
                order=i+1
            )

        # 6. Timeline
        timeline_data = [
            { "year": "2020", "title": "The Dream Begins", "description": "Conceptualized India's biggest inflatable adventure park" },
            { "year": "2021", "title": "Construction Starts", "description": "Began building our 20,000 sq ft facility with state-of-the-art equipment" },
            { "year": "2022", "title": "Grand Opening", "description": "Opened doors to thousands of excited ninjas!" },
            { "year": "2023", "title": "50K+ Happy Visitors", "description": "Celebrated serving over 50,000 happy customers" },
            { "year": "2024", "title": "Expansion & Growth", "description": "Added new zones and became India's #1 inflatable park" },
        ]

        self.stdout.write(f'Restoring {len(timeline_data)} timeline items...')
        TimelineItem.objects.all().delete()
        for i, item in enumerate(timeline_data):
            TimelineItem.objects.create(
                year=item['year'],
                title=item['title'],
                description=item['description'],
                active=True,
                order=i+1
            )
            
        # 7. Party Package
        party_data = {
            "name": "Party Package",
            "price": 1500,
            "min_participants": 10,
            "duration": 120, # 2 hours
            "description": "Celebrate with the ultimate adventure! Birthdays, school trips, corporate events - we've got you covered.",
            "includes": [
                "75 mins play + 1hr party room",
                "Party feast included",
                "Drinks & mini slush",
                "10 free spectators"
            ],
            "popular": True
        }
        
        self.stdout.write('Restoring party package...')
        PartyPackage.objects.all().delete()
        PartyPackage.objects.create(
            name=party_data['name'],
            price=party_data['price'],
            min_participants=party_data['min_participants'],
            duration=party_data['duration'],
            description=party_data['description'],
            includes=party_data['includes'],
            popular=party_data['popular'],
            active=True
        )

        
        self.stdout.write(self.style.SUCCESS('Successfully restored legacy content!'))
