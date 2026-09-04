"""
Complete SpinPin CMS Content Update Script
Run with: python manage.py shell < update_cms_spinpin.py
"""

from apps.cms.models import Activity, HomePage, AboutPage, PricingPage

def delete_old_activities():
    """Delete all existing Ninja Park activities"""
    print("\n" + "="*60)
    print("DELETING OLD ACTIVITIES")
    print("="*60)
    
    activities = Activity.objects.all()
    count = activities.count()
    print(f"Found {count} activities to delete:")
    for activity in activities:
        print(f"  - {activity.name}")
    
    deleted = activities.delete()[0]
    print(f"\n✓ Deleted {deleted} activities")
    return deleted

def create_spinpin_activities():
    """Create new SpinPin activities"""
    print("\n" + "="*60)
    print("CREATING SPINPIN ACTIVITIES")
    print("="*60)
    
    activities_data = [
        {
            'name': 'Roller Skating',
            'slug': 'roller-skating',
            'subtitle': "Experience Leicester's First Roller Skating Rink",
            'description': "Roller skating at Spin Pin Leicester is all about movement, energy, and pure fun. Our indoor skating rink is right in the heart of Leicester city centre.",
            'long_description': """### Your New Favourite Roller Skating Rink in Leicester

Roller skating at Spin Pin Leicester is all about movement, energy, and pure fun. Our indoor skating rink is right in the heart of Leicester city centre.

#### Why Roller Skate With Us?

- **First Roller Skating Rink in Leicester** - Whether you're a beginner or a seasoned skater, our smooth indoor rink and lively atmosphere make it the best place for roller skating in Leicester
- **Perfect for Parties** - Planning a roller skating party? Our venue is designed to host unforgettable celebrations for all ages
- **Central Location** - Easily accessible for anyone searching for indoor skating fun in Leicester city centre and beyond
- **Family-Friendly Fun** - We welcome kids, teens, and adults, making it the ideal spot for family days out or group activities

#### What to Expect?

- Spacious indoor skating rink with quality rental skates
- Music and lights to boost the fun atmosphere
- Friendly team ready to assist beginners and kids
- Sessions suitable for casual skating, parties, and events
- Food and drink options available on site""",
            'is_active': True,
            'display_order': 1
        },
        {
            'name': 'Ten Pin Bowling',
            'slug': 'ten-pin-bowling',
            'subtitle': 'Ten Pin Bowling in Leicester',
            'description': "Bowling at Spin Pin is all about energy, atmosphere, and straight up good times. Our ten pin bowling lanes are located right in the Leicester city centre.",
            'long_description': """### Ten Pin Bowling in Leicester, Fun for All at Spin Pin

Bowling at Spin Pin is all about energy, atmosphere, and straight up good times.

#### Why Bowl With Us?

- **Ten Pin Bowling Leicester** - With multiple lanes, professional equipment, and a lively vibe, our centre is ideal for both casual players and bowling enthusiasts
- **Central Location** - Easily accessible for those searching for bowling in Leicester city centre or around the surrounding areas
- **Perfect for Groups** - Whether it's a birthday, corporate event, school outing or just mates catching up, our lanes are designed to cater for groups of all sizes
- **Kids and Family Friendly** - Our bumper lanes, lighter balls, and soft seating make bowling accessible and fun for even the youngest players

#### What to Expect?

- Fully equipped lanes with automatic scoring
- Friendly staff ready to help beginners and families
- Food and drink options available on site
- A comfortable lounge area to relax between turns""",
            'is_active': True,
            'display_order': 2
        },
        {
            'name': 'Arcade Games',
            'slug': 'arcade-games',
            'subtitle': 'Play, Compete, and Win!',
            'description': "Step into Spin Pin Arcade in Leicester and rediscover the thrill of classic hits, modern gaming, and everything in between.",
            'long_description': """### Arcade Games in Leicester - Level Up at Spin Pin

Step into Spin Pin Arcade in Leicester and rediscover the thrill of classic hits, modern gaming, and everything in between.

#### Why play at Our Arcade?

- **Arcade Leicester** - From racing and shooting games to claw machines and basketball hoops, there is always something to challenge your mates or beat your own high score
- **All Ages Welcome** - Kids, teens, adults, we have a mix of games to suit every level and playstyle
- **Contactless** - Easily use your card directly at selected machines
- **Indoor Fun, Rain or Shine** - A go-to spot when you want proper entertainment without worrying about the weather

#### What to Expect?

- Dozens of machines including racing, shooters, claw games, air hockey, basketball, and more
- Neon lights, immersive sounds, and a buzzing atmosphere
- VR Arcade Games""",
            'is_active': True,
            'display_order': 3
        }
    ]
    
    created_activities = []
    for data in activities_data:
        activity = Activity.objects.create(**data)
        created_activities.append(activity)
        print(f"✓ Created: {activity.name}")
    
    print(f"\n✓ Created {len(created_activities)} new activities")
    return created_activities

def update_homepage():
    """Update homepage content"""
    print("\n" + "="*60)
    print("UPDATING HOMEPAGE")
    print("="*60)
    
    home, created = HomePage.objects.get_or_create(id=1)
    
    home.hero_title = "Welcome To Spin Pin"
    home.hero_subtitle = "Bowling, Roller Skating & Arcade in Leicester"
    home.welcome_title = "Skating, Bowling & Arcade Fun – All in One Place"
    home.welcome_text = """Welcome to Spin Pin – The ultimate destination in Leicester for fun and excitement! Whether you're looking to glide across the roller rink, strike big in our ten pin bowling lanes, or challenge your friends to thrilling arcade games, we've got something for everyone.

Perfect for roller skating parties, group outings, or a spontaneous day of adventure, Spin Pin offers an unforgettable experience filled with energy, music, and non-stop entertainment."""
    
    home.save()
    print(f"✓ Homepage {'created' if created else 'updated'}")
    return home

def update_about_page():
    """Update About Us page"""
    print("\n" + "="*60)
    print("UPDATING ABOUT US PAGE")
    print("="*60)
    
    about, created = AboutPage.objects.get_or_create(id=1)
    
    about.hero_title = "About Us"
    about.hero_subtitle = "Where Fun Never Stops!"
    about.content = """## Welcome to SpinPin – Where Fun Never Stops!

At SpinPin, we believe in creating unforgettable experiences filled with excitement, energy, and endless entertainment.

## Our Story

SpinPin was founded with one mission in mind – to bring people together through fun and engaging experiences.

## What We Offer

- **Roller Skating**: Experience Leicester's first roller skating rink
- **Bowling**: Ten pin bowling with family and friends
- **Arcade Games**: Classic and modern gaming experiences
- **Party Bookings**: Celebrate birthdays and special occasions

## Why Choose SpinPin?

- Welcoming atmosphere for everyone
- Variety of activities for all ages
- Perfect for any occasion
- Safety and quality as our top priority"""
    
    about.save()
    print(f"✓ About page {'created' if created else 'updated'}")
    return about

def update_pricing_page():
    """Update Pricing page"""
    print("\n" + "="*60)
    print("UPDATING PRICING PAGE")
    print("="*60)
    
    pricing, created = PricingPage.objects.get_or_create(id=1)
    
    pricing.hero_title = "Our Prices"
    pricing.hero_subtitle = "Spin Pin Leicester"
    pricing.content = """## Spin Pin Pricing

- **Skating / Bowling / VR**: £9.95 per game / per person
- **Roller Skate Hire**: £2.95 Each
- **Spectators (Age 4+)**: £2.95 Each
- **Spectators under 4**: FREE
- **Parking**: £3.00 Per Car
- **Locker Hire**: £2.00 Per Locker

### Payment Notice

**CASH ONLY** - Free to use CASH MACHINE is available on site.
**BOOK ONLINE TO PAY BY CARD**"""
    
    pricing.save()
    print(f"✓ Pricing page {'created' if created else 'updated'}")
    return pricing

# Run all updates
print("\n" + "="*70)
print(" " * 15 + "SPINPIN CMS CONTENT UPDATE")
print("="*70)

deleted_count = delete_old_activities()
new_activities = create_spinpin_activities()
update_homepage()
update_about_page()
update_pricing_page()

print("\n" + "="*70)
print(" " * 20 + "✓ UPDATE COMPLETE!")
print("="*70)
print(f"\n  - Deleted: {deleted_count} old activities")
print(f"  - Created: {len(new_activities)} new activities")
print(f"  - Updated: Homepage, About Us, Pricing pages")
print("\n" + "="*70 + "\n")
