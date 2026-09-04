"""
SpinPin Content Migration Script
Migrates all content from Ninja Inflatable Park to Spin Pin
Run with: python manage.py shell < migrate_spinpin_content.py
"""


from apps.cms.models import (
    HomePage, AboutPage, PricingPage, ContactInfo, 
    Activity, FAQ, SocialLink
)

def migrate_contact_info():
    """Update contact information to SpinPin details"""
    print("Updating contact information...")
    contact, created = ContactInfo.objects.get_or_create(id=1)
    contact.phone = "07349110865"
    contact.email = "info@spinpin.co.uk"
    contact.address = "Ramdoot House, First Floor - 2/3 Navigation Street, Leicester, LE13UR"
    contact.facebook_url = "https://www.facebook.com/profile.php?id=61572375597421"
    contact.instagram_url = "https://www.instagram.com/spinpinleicester"
    contact.save()
    print(f"✓ Contact info {'created' if created else 'updated'}")

def migrate_home_page():
    """Update homepage content"""
    print("Updating homepage...")
    home, created = HomePage.objects.get_or_create(id=1)
    home.hero_title = "Welcome To Spin Pin"
    home.hero_subtitle = "Bowling, Roller Skating & Arcade in Leicester"
    home.welcome_title = "Skating, Bowling & Arcade Fun – All in One Place"
    home.welcome_text = """Welcome to Spin Pin – The ultimate destination in Leicester for fun and excitement! Whether you're looking to glide across the roller rink, strike big in our ten pin bowling lanes, or challenge your friends to thrilling arcade games, we've got something for everyone.

Perfect for roller skating parties, group outings, or a spontaneous day of adventure, Spin Pin offers an unforgettable experience filled with energy, music, and non-stop entertainment."""
    home.save()
    print(f"✓ Homepage {'created' if created else 'updated'}")

def migrate_about_page():
    """Update About Us page"""
    print("Updating About Us page...")
    about, created = AboutPage.objects.get_or_create(id=1)
    about.hero_title = "About Us"
    about.hero_subtitle = "Where Fun Never Stops!"
    about.content = """## Welcome to SpinPin – Where Fun Never Stops!

At SpinPin, we believe in creating unforgettable experiences filled with excitement, energy, and endless entertainment. Whether you're gliding across our roller rink, aiming for a perfect strike in our bowling alley, or challenging your friends to the latest arcade games, we offer something for everyone.

## Our Story

SpinPin was founded with one mission in mind – to bring people together through fun and engaging experiences. We wanted to create a space where visitors of all ages could enjoy a mix of classic and modern entertainment under one roof.

## What We Offer

- **Roller Skating**: Experience the thrill of skating on our smooth, well-maintained rink
- **Bowling**: Enjoy a fun-filled game of bowling with family and friends
- **Arcade Games & More**: From classic arcade favorites to the latest gaming experiences
- **Party & Event Bookings**: Celebrate birthdays and special occasions with us
- **Session Booking**: Book your session in advance for a hassle-free experience

## Why Choose SpinPin?

- A Welcoming Atmosphere for everyone
- A Variety of Activities for all ages
- Perfect for Any Occasion
- Safety & Quality as our top priority"""
    about.save()
    print(f"✓ About page {'created' if created else 'updated'}")

def migrate_activities():
    """Replace old activities with SpinPin activities"""
    print("Migrating activities...")
    
    # Delete all existing activities
    deleted_count = Activity.objects.all().delete()[0]
    print(f"✓ Deleted {deleted_count} old activities")
    
    # Create Roller Skating activity
    roller_skating = Activity.objects.create(
        name="Roller Skating",
        slug="roller-skating",
        subtitle="Experience Leicester's First Roller Skating Rink",
        description="""Roller skating at Spin Pin Leicester is all about movement, energy, and pure fun. Our indoor skating rink is right in the heart of Leicester city centre, providing the perfect place to rollerskate, party, and enjoy time with friends and family.""",
        long_description="""### Your New Favourite Roller Skating Rink in Leicester

Roller skating at Spin Pin Leicester is all about movement, energy, and pure fun. Our indoor skating rink is right in the heart of Leicester city centre.

### Why Roller Skate With Us?

- First Roller Skating Rink in Leicester
- Perfect for Parties
- Central Location
- Family-Friendly Fun
- Spacious indoor rink with quality rental skates
- Music and lights atmosphere

### What to Expect?

- Spacious indoor skating rink with quality rental skates
- Music and lights to boost the fun atmosphere
- Friendly team ready to assist beginners and kids
- Sessions suitable for casual skating, parties, and events
- Food and drink options available on site""",
        is_active=True,
        display_order=1
    )
    print(f"✓ Created Roller Skating activity")
    
    # Create Ten Pin Bowling activity
    bowling = Activity.objects.create(
        name="Ten Pin Bowling",
        slug="ten-pin-bowling",
        subtitle="Ten Pin Bowling in Leicester",
        description="""Bowling at Spin Pin is all about energy, atmosphere, and straight up good times. Our ten pin bowling lanes are located right in the Leicester city centre, offering a space where people can turn up, play, and enjoy themselves.""",
        long_description="""### Ten Pin Bowling in Leicester, Fun for All at Spin Pin

Bowling at Spin Pin is all about energy, atmosphere, and straight up good times.

### Why Bowl With Us?

- Multiple lanes with professional equipment
- Central Location in Leicester city centre
- Perfect for Groups and events
- Kids and Family Friendly with bumper lanes
- Fully equipped lanes with automatic scoring

### What to Expect?

- Fully equipped lanes with automatic scoring
- Friendly staff ready to help beginners and families
- Food and drink options available on site
- A comfortable lounge area to relax between turns""",
        is_active=True,
        display_order=2
    )
    print(f"✓ Created Ten Pin Bowling activity")
    
    # Create Arcade Games activity
    arcade = Activity.objects.create(
        name="Arcade Games",
        slug="arcade-games",
        subtitle="Play, Compete, and Win!",
        description="""Step into Spin Pin Arcade in Leicester and rediscover the thrill of classic hits, modern gaming, and everything in between. With flashing lights, nostalgic sounds, and a competitive buzz in the air, our Leicester arcade is the perfect space to get stuck into some serious button bashing fun.""",
        long_description="""### Arcade Games in Leicester - Level Up at Spin Pin

Step into Spin Pin Arcade in Leicester and rediscover the thrill of classic hits, modern gaming, and everything in between.

### Why play at Our Arcade?

- Racing, shooting games, claw machines, basketball hoops
- All Ages Welcome
- Contactless payment available
- Indoor Fun, Rain or Shine
- VR Arcade Games

### What to Expect?

- Dozens of machines including racing, shooters, claw games, air hockey, basketball
- Neon lights, immersive sounds, and a buzzing atmosphere
- VR Arcade Games for the ultimate experience""",
        is_active=True,
        display_order=3
    )
    print(f"✓ Created Arcade Games activity")
    
    return roller_skating, bowling, arcade

def migrate_pricing():
    """Update pricing page"""
    print("Updating pricing...")
    pricing, created = PricingPage.objects.get_or_create(id=1)
    pricing.hero_title = "Our Prices"
    pricing.hero_subtitle = "Spin Pin"
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
BOOK ONLINE TO PAY BY CARD."""
    pricing.save()
    print(f"✓ Pricing page {'created' if created else 'updated'}")

def main():
    """Run all migrations"""
    print("=" * 50)
    print("SPINPIN CONTENT MIGRATION")
    print("=" * 50)
    print()
    
    migrate_contact_info()
    migrate_home_page()
    migrate_about_page()
    migrate_activities()
    migrate_pricing()
    
    print()
    print("=" * 50)
    print("✓ MIGRATION COMPLETE!")
    print("=" * 50)
    print()
    print("Summary:")
    print(f"- Contact Info: Updated")
    print(f"- Home Page: Updated")
    print(f"- About Page: Updated")
    print(f"- Activities: {Activity.objects.count()} created")
    print(f"- Pricing: Updated")

if __name__ == "__main__":
    main()
