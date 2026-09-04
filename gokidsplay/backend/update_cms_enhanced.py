"""
Enhanced SpinPin CMS Content Update - Complete Website Content
Run with: Get-Content update_cms_enhanced.py | python manage.py shell
"""

from apps.cms.models import Activity, HomePage, AboutPage, PricingPage
from apps.core.models import GlobalSettings

def update_global_settings():
    """Update global settings with SpinPin details"""
    print("\n" + "="*60)
    print("UPDATING GLOBAL SETTINGS")
    print("="*60)
    
    settings, created = GlobalSettings.objects.get_or_create(id=1)
    
    settings.park_name = "Spin Pin"
    settings.contact_phone = "07349110865"
    settings.contact_email = "info@spinpin.co.uk"
    settings.address = "Ramdoot House, First Floor - 2/3 Navigation Street, Leicester, LE13UR"
    settings.map_url = "https://www.google.com/maps/dir/?api=1&destination=Spin+Pin+Leicester"
    
    settings.save()
    print(f"✓ Global settings {'created' if created else 'updated'}")
    return settings

def delete_old_activities():
    """Delete all existing activities"""
    print("\n" + "="*60)
    print("DELETING OLD ACTIVITIES")
    print("="*60)
    
    activities = Activity.objects.all()
    count = activities.count()
    if count > 0:
        print(f"Found {count} activities to delete")
        deleted = activities.delete()[0]
        print(f"✓ Deleted {deleted} activities")
        return deleted
    else:
        print("No activities to delete")
        return 0

def create_enhanced_activities():
    """Create new SpinPin activities with complete content"""
    print("\n" + "="*60)
    print("CREATING ENHANCED SPINPIN ACTIVITIES")
    print("="*60)
    
    activities_data = [
        {
            'name': 'Roller Skating',
            'slug': 'roller-skating',
            'subtitle': "Experience Leicester's First Roller Skating Rink",
            'description': "Roller skating at Spin Pin Leicester is all about movement, energy, and pure fun. Our indoor skating rink is right in the heart of Leicester city centre, providing the perfect place to rollerskate, party, and enjoy time with friends and family.",
            'long_description': """### Your New Favourite Roller Skating Rink in Leicester

Roller skating at Spin Pin Leicester is all about movement, energy, and pure fun. Our indoor skating rink is right in the heart of Leicester city centre, providing the perfect place to rollerskate, party, and enjoy time with friends and family.

### Why Roller Skate With Us?

We are not just another roller rink. We have created an exciting, vibrant environment where everyone can feel the thrill of skating:

- **First Roller Skating Rink in Leicester** - Whether you're a beginner or a seasoned skater, our smooth indoor rink and lively atmosphere make it the best place for roller skating in Leicester
- **Perfect for Parties** - Planning a roller skating party? Our venue is designed to host unforgettable celebrations for all ages
- **Central Location** - Easily accessible for anyone searching for indoor skating fun in Leicester city centre and beyond
- **Family-Friendly Fun** - We welcome kids, teens, and adults, making it the ideal spot for family days out or group activities

### What to Expect?

When you visit Spin Pin's roller rink, you are in for an exciting experience:

- Spacious indoor skating rink with quality rental skates
- Music and lights to boost the fun atmosphere
- Friendly team ready to assist beginners and kids
- Sessions suitable for casual skating, parties, and events
- Food and drink options available on site

We focus on creating a roller skating experience that is safe, fun, and memorable for all.

### Location, Leicester City Centre

Spin Pin is located just minutes from Leicester's city centre, with great public transport links and Free Parking on site.

### Book Your Roller Skating Session

Ready to roll? Our roller skating sessions and party slots fill up quickly, especially on weekends. Don't miss out, book your spot today and experience why we are the go-to destination for indoor skating fun in Leicester!""",
            'is_active': True,
            'display_order': 1
        },
        {
            'name': 'Ten Pin Bowling',
            'slug': 'ten-pin-bowling',
            'subtitle': 'Ten Pin Bowling in Leicester',
            'description': "Bowling at Spin Pin is all about energy, atmosphere, and straight up good times. Our ten pin bowling lanes are located right in the Leicester city centre, offering a space where people can turn up, play, and enjoy themselves.",
            'long_description': """### Ten Pin Bowling in Leicester, Fun for All at Spin Pin

Bowling at Spin Pin is all about energy, atmosphere, and straight up good times. Our ten pin bowling lanes are located right in the Leicester city centre, offering a space where people can turn up, play, and enjoy themselves, without overcomplicating it.

### Why Bowl With Us?

We are not your average bowling alley. We have created an immersive environment that blends leisure, fun, and excitement under one roof:

- **Ten Pin Bowling Leicester** - With multiple lanes, professional equipment, and a lively vibe, our centre is ideal for both casual players and bowling enthusiasts
- **Central Location** - Easily accessible for those searching for bowling in Leicester city centre or around the surrounding areas
- **Perfect for Groups** - Whether it's a birthday, corporate event, school outing or just mates catching up, our lanes are designed to cater for groups of all sizes
- **Kids and Family Friendly** - Our bumper lanes, lighter balls, and soft seating make bowling accessible and fun for even the youngest players

### What to Expect?

When you visit Spin Pin, you will get more than just bowling:

- Fully equipped lanes with automatic scoring
- Friendly staff ready to help beginners and families
- Food and drink options available on site
- A comfortable lounge area to relax between turns

Our ten pin bowling experience in Leicester is designed to be social, exciting, and memorable.

### Location, Leicester City Centre

We are located just minutes from the heart of Leicester, with easy access from public transport and parking available on site.

### Book Your Game Today

Don't miss out, our lanes fill up fast, especially on weekends and holidays. Secure your slot now and discover why we are one of the top spots for bowling Leicester has to offer.""",
            'is_active': True,
            'display_order': 2
        },
        {
            'name': 'Arcade Games',
            'slug': 'arcade-games',
            'subtitle': 'Play, Compete, and Win!',
            'description': "Step into Spin Pin Arcade in Leicester and rediscover the thrill of classic hits, modern gaming, and everything in between. With flashing lights, nostalgic sounds, and a competitive buzz in the air, our Leicester arcade is the perfect space to get stuck into some serious button bashing fun.",
            'long_description': """### Arcade Games in Leicester - Level Up at Spin Pin

Step into Spin Pin Arcade in Leicester and rediscover the thrill of classic hits, modern gaming, and everything in between. With flashing lights, nostalgic sounds, and a competitive buzz in the air, our Leicester arcade is the perfect space to get stuck into some serious button bashing fun.

Our arcade area is built for people who want to switch off and enjoy something different, no pressure, no long queues, just pure gaming.

### Why play at Our Arcade?

We have created a full on gaming zone that brings together retro favourites and the latest in arcade games, all under one roof:

- **Arcade Leicester** - From racing and shooting games to claw machines and basketball hoops, there is always something to challenge your mates or beat your own high score
- **All Ages Welcome** - Kids, teens, adults, we have a mix of games to suit every level and playstyle
- **Contactless** - Easily use your card directly at selected machines
- **Indoor Fun, Rain or Shine** - A go-to spot when you want proper entertainment without worrying about the weather

### What to Expect?

Spin Pin's arcade in Leicester is set up to give you that old school feel without feeling outdated. Here is what you will find inside:

- Dozens of machines including racing, shooters, claw games, air hockey, basketball, and more
- Neon lights, immersive sounds, and a buzzing atmosphere
- VR Arcade Games

Whether you are aiming for the prize counter or just here for the fun, our Leicester arcade has something that will keep you coming back.""",
            'is_active': True,
            'display_order': 3
        }
    ]
    
    created_activities = []
    for data in activities_data:
        activity = Activity.objects.create(**data)
        created_activities.append(activity)
        print(f"✓ Created: {activity.name}")
    
    print(f"\n✓ Created {len(created_activities)} enhanced activities")
    return created_activities

def update_enhanced_homepage():
    """Update homepage with complete content"""
    print("\n" + "="*60)
    print("UPDATING HOMEPAGE")
    print("="*60)
    
    home, created = HomePage.objects.get_or_create(id=1)
    
    home.hero_title = "Welcome To Spin Pin"
    home.hero_subtitle = "Bowling, Roller Skating & Arcade in Leicester"
    home.welcome_title = "Skating, Bowling & Arcade Fun – All in One Place"
    home.welcome_text = """Welcome to Spin Pin – The ultimate destination in Leicester for fun and excitement! Whether you're looking to glide across the roller rink, strike big in our ten pin bowling lanes, or challenge your friends to thrilling arcade games, we've got something for everyone.

Enjoy a variety of attractions:
- Arcade Games for all ages
- Roller Skating parties and open roller rink sessions
- Ten Pin Bowling
- VR Arcade

Perfect for roller skating parties, group outings, or a spontaneous day of adventure, Spin Pin offers an unforgettable experience filled with energy, music, and non-stop entertainment."""
    
    home.save()
    print(f"✓ Homepage {'created' if created else 'updated'}")
    return home

def update_enhanced_about_page():
    """Update About Us page with complete content"""
    print("\n" + "="*60)
    print("UPDATING ABOUT US PAGE")
    print("="*60)
    
    about, created = AboutPage.objects.get_or_create(id=1)
    
    about.hero_title = "About Us"
    about.hero_subtitle = "Where Fun Never Stops!"
    about.content = """## Welcome to SpinPin – Where Fun Never Stops!

At SpinPin, we believe in creating unforgettable experiences filled with excitement, energy, and endless entertainment. Whether you're gliding across our roller rink, aiming for a perfect strike in our bowling alley, or challenging your friends to the latest arcade games, we offer something for everyone. We're more than just a venue – we're a place where friends, families, and thrill-seekers come together to enjoy action-packed activities, celebrate special occasions, and make lasting memories.

## Our Story

SpinPin was founded with one mission in mind – to bring people together through fun and engaging experiences. We wanted to create a space where visitors of all ages could enjoy a mix of classic and modern entertainment under one roof. From the nostalgia of roller skating to the competitive thrill of bowling and the excitement of arcade games, we've designed our venue to be the ultimate destination for excitement, adventure, and social connection.

## What We Offer

At SpinPin, we cater to a variety of entertainment needs. Whether you're planning a casual day out or a large celebration, we've got you covered with:

- **Roller Skating**: Experience the thrill of skating on our smooth, well-maintained rink, perfect for both beginners and experienced skaters
- **Bowling**: Enjoy a fun-filled game of bowling with family and friends in our lively lanes
- **Arcade Games & More**: From classic arcade favorites to the latest gaming experiences, our selection of games offers non-stop entertainment
- **Party & Event Bookings**: Celebrate birthdays, special occasions, and group outings with our fully customizable party packages designed to make your event truly special
- **Session Booking**: Whether you're looking for a fun weekend activity or an after-school hangout, book your session in advance and enjoy a hassle-free experience

## Why Choose SpinPin?

We are not just another entertainment venue – we're a place where community, excitement, and top-quality experiences come together. Here's why visitors love SpinPin:

- **A Welcoming Atmosphere**: Whether you're a first-time skater or a bowling pro, our friendly and inviting environment makes everyone feel at home
- **A Variety of Activities**: With so many options to choose from, there's something for every age and interest
- **Perfect for Any Occasion**: Whether you're celebrating a birthday, hosting a team event, or just looking for a fun way to spend your day, SpinPin offers the perfect setting
- **Safety & Quality**: We prioritize the safety and comfort of our guests by maintaining high standards across all our activities"""
    
    about.save()
    print(f"✓ About page {'created' if created else 'updated'}")
    return about

def update_enhanced_pricing_page():
    """Update Pricing page with complete content"""
    print("\n" + "="*60)
    print("UPDATING PRICING PAGE")
    print("="*60)
    
    pricing, created = PricingPage.objects.get_or_create(id=1)
    
    pricing.hero_title = "Our Prices"
    pricing.hero_subtitle = "Spin Pin Leicester"
    pricing.content = """## Spin Pin Pricing

- **Skating / Bowling / VR Participants**: £9.95 per game / per person
- **Roller Skate Hire**: £2.95 Each
- **Spectators (Age 4+)**: £2.95 Each
- **Spectators under 4**: FREE
- **Parking Per Car**: £3.00
- **Locker Hire**: £2.00 Per Locker

### Payment Notice

**CASH ONLY**

Free to use CASH MACHINE is available on site.

**BOOK ONLINE TO PAY BY CARD**"""
    
    pricing.save()
    print(f"✓ Pricing page {'created' if created else 'updated'}")
    return pricing

# Run all updates
print("\n" + "="*70)
print(" " * 10 + "ENHANCED SPINPIN CMS CONTENT UPDATE")
print("="*70)

update_global_settings()
deleted_count = delete_old_activities()
new_activities = create_enhanced_activities()
update_enhanced_homepage()
update_enhanced_about_page()
update_enhanced_pricing_page()

print("\n" + "="*70)
print(" " * 15 + "✓ ENHANCED UPDATE COMPLETE!")
print("="*70)
print(f"\n  - Global Settings: Updated")
print(f"  - Deleted: {deleted_count} old activities")
print(f"  - Created: {len(new_activities)} enhanced activities with full content")
print(f"  - Updated: Homepage, About Us, Pricing pages with complete content")
print("\nAll CMS content has been comprehensively updated with SpinPin website content!")
print("="*70 + "\n")
