"""
Populate all SpinPin content - Activities, Booking Info, FAQs, Legal Pages
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.cms.models import Activity, BookingInformation, Faq, LegalDocument, PageSection

def update_activities():
    """Update all three activities with full SpinPin content"""
    
    # Roller Skating
    roller_skating, created = Activity.objects.update_or_create(
        slug='roller-skating',
        defaults={
            'name': 'Roller Skating',
            'short_description': "Experience Leicester's first roller skating rink! Perfect for all ages and skill levels.",
            'description': """Roller skating at Spin Pin Leicester is all about movement, energy, and pure fun. Our indoor skating rink is right in the heart of Leicester city centre, providing the perfect place to rollerskate, party, and enjoy time with friends and family.""",
            'why_choose_us': """We are not just another roller rink. We have created an exciting, vibrant environment where everyone can feel the thrill of skating:

• First Roller Skating Rink in Leicester - whether you're a beginner or a seasoned skater, our smooth indoor rink and lively atmosphere make it the best place for roller skating in Leicester.

• Perfect for Parties - planning a roller skating party? Our venue is designed to host unforgettable celebrations for all ages.

• Central Location - easily accessible for anyone searching for indoor skating fun in Leicester city centre and beyond.

• Family-Friendly Fun - we welcome kids, teens, and adults, making it the ideal spot for family days out or group activities.""",
            'what_to_expect': """When you visit Spin Pin's roller rink, you are in for an exciting experience:

• Spacious indoor skating rink with quality rental skates
• Music and lights to boost the fun atmosphere
• Friendly team ready to assist beginners and kids
• Sessions suitable for casual skating, parties, and events
• Food and drink options available on site

We focus on creating a roller skating experience that is safe, fun, and memorable for all.""",
            'location_info': "Spin Pin is located just minutes from Leicester's city centre, with great public transport links and Free Parking on site.",
            'activity_faqs': [
                {
                    "question": "Do I need to book in advance?",
                    "answer": "We recommend booking online to secure your spot, especially on weekends and during peak times."
                },
                {
                    "question": "Do you provide skates?",
                    "answer": "Yes! Roller skate hire is included in your session booking at £2.95 per person."
                },
                {
                    "question": "Can beginners join?",
                    "answer": "Absolutely! Our friendly staff are here to help beginners, and we have sessions suitable for all skill levels."
                },
                {
                    "question": "What should I wear?",
                    "answer": "Wear comfortable clothing that allows freedom of movement. We recommend long socks and bringing a light jacket."
                }
            ],
            'image_url': '/media/activities/roller-skating.jpg',
            'active': True,
            'order': 1
        }
    )
    print(f"✓ {'Created' if created else 'Updated'} Roller Skating activity")
    
    # Ten Pin Bowling
    bowling, created = Activity.objects.update_or_create(
        slug='ten-pin-bowling',
        defaults={
            'name': 'Ten Pin Bowling',
            'short_description': "Strike big at our ten pin bowling lanes! Fun for all ages with professional equipment.",
            'description': """Bowling at Spin Pin is all about energy, atmosphere, and straight up good times. Our ten pin bowling lanes are located right in the Leicester city centre, offering a space where people can turn up, play, and enjoy themselves, without overcomplicating it.""",
            'why_choose_us': """We are not your average bowling alley. We have created an immersive environment that blends leisure, fun, and excitement under one roof:

• Ten Pin Bowling Leicester - with multiple lanes, professional equipment, and a lively vibe, our centre is ideal for both casual players and bowling enthusiasts.

• Central Location - easily accessible for those searching for bowling in Leicester city centre or around the surrounding areas.

• Perfect for Groups - whether it is a birthday, corporate event, school outing or just mates catching up, our lanes are designed to cater for groups of all sizes.

• Kids and Family Friendly - our bumper lanes, lighter balls, and soft seating make bowling accessible and fun for even the youngest players.""",
            'what_to_expect': """When you visit Spin Pin, you will get more than just bowling:

• Fully equipped lanes with automatic scoring
• Friendly staff ready to help beginners and families
• Food and drink options available on site
• A comfortable lounge area to relax between turns

Our ten pin bowling experience in Leicester is designed to be social, exciting, and memorable.""",
            'location_info': "We are located just minutes from the heart of Leicester, with easy access from public transport and parking available on site.",
            'activity_faqs': [
                {
                    "question": "How many people can bowl per lane?",
                    "answer": "Each lane can accommodate up to 6 players comfortably."
                },
                {
                    "question": "Do you have bumpers for kids?",
                    "answer": "Yes! We have bumper lanes and lighter bowling balls perfect for children."
                },
                {
                    "question": "Can I book multiple lanes?",
                    "answer": "Absolutely! Book as many lanes as you need for your group or event."
                },
                {
                    "question": "Do you provide bowling shoes?",
                    "answer": "Yes, bowling shoes are included with your lane booking."
                }
            ],
            'image_url': '/media/activities/bowling.jpg',
            'active': True,
            'order': 2
        }
    )
    print(f"✓ {'Created' if created else 'Updated'} Ten Pin Bowling activity")
    
    # Arcade Games
    arcade, created = Activity.objects.update_or_create(
        slug='arcade-games',
        defaults={
            'name': 'Arcade Games',
            'short_description': "Level up at our arcade! Classic favorites, modern games, and VR experiences.",
            'description': """Step into Spin Pin Arcade in Leicester and rediscover the thrill of classic hits, modern gaming, and everything in between. With flashing lights, nostalgic sounds, and a competitive buzz in the air, our Leicester arcade is the perfect space to get stuck into some serious button bashing fun.""",
            'why_choose_us': """We have created a full on gaming zone that brings together retro favourites and the latest in arcade games, all under one roof:

• Arcade Leicester - from racing and shooting games to claw machines and basketball hoops, there is always something to challenge your mates or beat your own high score.

• All Ages Welcome - kids, teens, adults, we have a mix of games to suit every level and playstyle.

• Contactless - easily use your card directly at selected machines.

• Indoor Fun, Rain or Shine - a go to spot when you want proper entertainment without worrying about the weather.""",
            'what_to_expect': """Spin Pin's arcade in Leicester is set up to give you that old school feel without feeling outdated. Here is what you will find inside:

• Dozens of machines including racing, shooters, claw games, air hockey, basketball, and more
• Neon lights, immersive sounds, and a buzzing atmosphere
• VR Arcade Games

Whether you are aiming for the prize counter or just here for the fun, our Leicester arcade has something that will keep you coming back.""",
            'location_info': "Located in Leicester city centre with easy access and parking available.",
            'activity_faqs': [
                {
                    "question": "How do I pay for arcade games?",
                    "answer": "Most machines accept contactless card payments directly. Some may require tokens available at the counter."
                },
                {
                    "question": "Do you have VR games?",
                    "answer": "Yes! We have VR arcade games for an immersive gaming experience."
                },
                {
                    "question": "Are there games for young children?",
                    "answer": "Absolutely! We have age-appropriate games including claw machines, racing games, and more."
                },
                {
                    "question": "Can I win prizes?",
                    "answer": "Yes! Many of our games offer tickets that can be redeemed for prizes at our prize counter."
                }
            ],
            'image_url': '/media/activities/arcade.jpg',
            'active': True,
            'order': 3
        }
    )
    print(f"✓ {'Created' if created else 'Updated'} Arcade Games activity")

def create_booking_information():
    """Create booking information pages"""
    
    # Session Booking Info
    session_info, created = BookingInformation.objects.update_or_create(
        booking_type='SESSION',
        defaults={
            'title': 'Spin Pin Session Booking',
            'subtitle': "Booking Available from Thursday's to Sunday's",
            'content': """Half Term - Peak School & Bank holidays.

Monday - Closed
Tuesday to Sunday 12 pm to 10:00 pm""",
            'sessions_info': [
                {
                    "name": "Rolly Polly",
                    "description": "A general skate session Open to all ages and ability",
                    "schedule": ["Thursday 3 pm to 8 pm", "Friday 3 pm to 8 pm", "Saturday and Sunday 12 pm to 8 pm"]
                },
                {
                    "name": "Teen Tribe",
                    "description": "Skating session for teens aged 13 to 17 years old only of all skating abilities",
                    "schedule": ["Thursday 8 pm to 9:30 pm"]
                },
                {
                    "name": "Grown-up Glide",
                    "description": "Adult only skating session 18+ of all skating abilities",
                    "schedule": ["Friday 8 pm to 9:30 pm"]
                },
                {
                    "name": "Grand Disco",
                    "description": "For all ages and abilities",
                    "schedule": ["Saturday 8 pm to 9:30 pm"]
                }
            ],
            'rules_content': """SPIN PIN ROLLER SKATING VENUE – RULES & GUIDELINES

Welcome to Spin Pin! To ensure that all our guests have a safe and enjoyable experience, we ask that you read and follow the following rules and guidelines.

1. GENERAL RULES
• Skating Area: Only roller skates, inline skates, or skateboards are permitted on the rink
• Use of Skates: participants must not skate outside the rink or wear the skates to the toilets, café or to access any other areas
• Adherence to Instructions: All skaters must follow the instructions provided by Spin Pin staff
• Respect for Others: Always be considerate and respectful towards fellow skaters
• Alcohol and Drugs: Strictly prohibited
• Smoking: Not allowed inside the venue

2. SAFETY GUIDELINES
• Participation: you must not participate without signing the required waiver
• Skating at Your Own Risk: Roller skating involves inherent risks of injury
• Safety Gear: Encouraged for all skaters, especially beginners
• Skate Within Your Ability: Skate at speeds appropriate for your skill level

3. AGE RESTRICTIONS
• Minimum Age: Skating is permitted for individuals aged 5 and up
• Children under 16 must be accompanied by an adult (18 years or older)""",
            'active': True
        }
    )
    print(f"✓ {'Created' if created else 'Updated'} Session Booking Information")

def create_general_faqs():
    """Create general FAQs"""
    
    faqs_data = [
        {
            "question": "What are your opening hours?",
            "answer": "We are open Tuesday to Sunday from 12 pm to 10 pm. We are closed on Mondays except during peak times (school holidays and bank holidays).",
            "category": "General",
            "order": 1
        },
        {
            "question": "Do I need to book in advance?",
            "answer": "We highly recommend booking online to guarantee your spot, especially during weekends and peak times. Walk-ins are welcome subject to availability.",
            "category": "Booking",
            "order": 2
        },
        {
            "question": "Is parking available?",
            "answer": "Yes! We have free parking on site. Please note parking is restricted to 2 hours. For extended parking, please register your vehicle at reception (maximum 3 hours).",
            "category": "General",
            "order": 3
        },
        {
            "question": "What payment methods do you accept?",
            "answer": "We are CASH ONLY at the venue. A free cash machine is available on site. However, you can pay by card when booking online.",
            "category": "Payment",
            "order": 4
        },
        {
            "question": "Do you cater for dietary requirements?",
            "answer": "Yes! We offer vegetarian and halal food options. Please inform us of any allergies or dietary requirements at least 2 days before your visit.",
            "category": "Food",
            "order": 5
        },
        {
            "question": "What is your age policy?",
            "answer": "Most activities are suitable for ages 5+. Children under 16 must be accompanied by an adult (18+). We have specific sessions for different age groups.",
            "category": "General",
            "order": 6
        },
        {
            "question": "Do I need to sign a waiver?",
            "answer": "Yes, all participants must sign a waiver before participating in any activities. You can complete this online before your visit or at the venue.",
            "category": "Safety",
            "order": 7
        },
        {
            "question": "Can I bring my own food?",
            "answer": "Outside food and drinks are not permitted. We have a café on site offering a variety of food and drinks.",
            "category": "Food",
            "order": 8
        }
    ]
    
    for faq_data in faqs_data:
        faq, created = Faq.objects.update_or_create(
            question=faq_data['question'],
            defaults=faq_data
        )
        print(f"✓ {'Created' if created else 'Updated'} FAQ: {faq.question[:50]}")

def update_homepage_content():
    """Update homepage sections"""
    
    # Hero section
    hero, created = PageSection.objects.update_or_create(
        page='home',
        section_key='hero',
        defaults={
            'title': 'Welcome To Spin Pin',
            'subtitle': 'Bowling, Roller Skating & Arcade in Leicester',
            'content': """CASH ONLY
Free to use CASH MACHINE is available on site.
BOOK ONLINE TO PAY BY CARD.
Thank You

Skating, Bowling & Arcade Fun – All in One Place

Welcome to Spin Pin – The ultimate destination in Leicester for fun and excitement! Whether you're looking to glide across the roller rink, strike big in our ten pin bowling lanes, or challenge your friends to thrilling arcade games, we've got something for everyone.

Enjoy a variety of attractions:
• Arcade Games for all ages
• Roller Skating parties and open roller rink sessions
• Ten Pin Bowling
• VR Arcade

Perfect for roller skating parties, group outings, or a spontaneous day of adventure, Spin Pin offers an unforgettable experience filled with energy, music, and non-stop entertainment.""",
            'cta_text': 'Book your session today',
            'cta_link': '/book',
            'order': 1,
            'active': True
        }
    )
    print(f"✓ {'Created' if created else 'Updated'} Homepage hero section")

def main():
    """Run all content updates"""
    print("=" * 60)
    print("POPULATING SPINPIN CONTENT")
    print("=" * 60)
    
    print("\n1. Updating Activities...")
    update_activities()
    
    print("\n2. Creating Booking Information...")
    create_booking_information()
    
    print("\n3. Creating General FAQs...")
    create_general_faqs()
    
    print("\n4. Updating Homepage Content...")
    update_homepage_content()
    
    print("\n" + "=" * 60)
    print("✅ ALL CONTENT POPULATED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    main()
