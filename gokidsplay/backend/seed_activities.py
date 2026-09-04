"""
Seed activity detail fields (why_choose_us, what_to_expect, location_info)
for the Attractions page "Learn More" panels.

Run with:
    python manage.py shell < seed_activities.py
"""

from apps.cms.models import Activity

ACTIVITY_DATA = [
    {
        "slug": "roller-skating",
        "why_choose_us": (
            "We are not just another roller rink. We have created an exciting, vibrant environment where everyone can feel the thrill of skating:\n\n"
            "• First Roller Skating Rink in Leicester — Whether you're a beginner or a seasoned skater, our smooth indoor rink and lively atmosphere make it the best place for roller skating in Leicester.\n"
            "• Perfect for Parties — Planning a roller skating party? Our venue is designed to host unforgettable celebrations for all ages.\n"
            "• Central Location — Easily accessible for anyone searching for indoor skating fun in Leicester city centre and beyond.\n"
            "• Family-Friendly Fun — We welcome kids, teens, and adults, making it the ideal spot for family days out or group activities."
        ),
        "what_to_expect": (
            "When you visit Spin Pin's roller rink, you are in for an exciting experience:\n\n"
            "• Spacious indoor skating rink with quality rental skates\n"
            "• Music and lights to boost the fun atmosphere\n"
            "• Friendly team ready to assist beginners and kids\n"
            "• Sessions suitable for casual skating, parties, and events\n"
            "• Food and drink options available on site\n\n"
            "We focus on creating a roller skating experience that is safe, fun, and memorable for all."
        ),
        "location_info": (
            "Spin Pin is located just minutes from Leicester's city centre, with great public transport links and parking available on site. "
            "Ramdoot House, First Floor – 2/3 Navigation Street, Leicester, LE1 3UR."
        ),
    },
    {
        "slug": "ten-pin-bowling",
        "why_choose_us": (
            "We are not your average bowling alley. We have created an immersive environment that blends leisure, fun, and excitement under one roof:\n\n"
            "• Ten Pin Bowling Leicester — With multiple lanes, professional equipment, and a lively vibe, our centre is ideal for both casual players and bowling enthusiasts.\n"
            "• Central Location — Easily accessible for those searching for bowling in Leicester city centre or around the surrounding areas.\n"
            "• Perfect for Groups — Whether it's a birthday, corporate event, school outing or just mates catching up, our lanes are designed to cater for groups of all sizes.\n"
            "• Kids and Family Friendly — Our bumper lanes, lighter balls, and soft seating make bowling accessible and fun for even the youngest players."
        ),
        "what_to_expect": (
            "When you visit Spin Pin, you will get more than just bowling:\n\n"
            "• Fully equipped lanes with automatic scoring\n"
            "• Friendly staff ready to help beginners and families\n"
            "• Food and drink options available on site\n"
            "• A comfortable lounge area to relax between turns\n\n"
            "Our ten pin bowling experience in Leicester is designed to be social, exciting, and memorable."
        ),
        "location_info": (
            "We are located just minutes from the heart of Leicester, with easy access from public transport and parking available on site. "
            "Ramdoot House, First Floor – 2/3 Navigation Street, Leicester, LE1 3UR."
        ),
    },
    {
        "slug": "arcade-games",
        "why_choose_us": (
            "We have created a full-on gaming zone that brings together retro favourites and the latest in arcade games, all under one roof:\n\n"
            "• Arcade Leicester — From racing and shooting games to claw machines and basketball hoops, there is always something to challenge your mates or beat your own high score.\n"
            "• All Ages Welcome — Kids, teens, adults — we have a mix of games to suit every level and playstyle.\n"
            "• Contactless — Easily use your card directly at selected machines.\n"
            "• Indoor Fun, Rain or Shine — A go-to spot when you want proper entertainment without worrying about the weather."
        ),
        "what_to_expect": (
            "Spin Pin's arcade in Leicester is set up to give you that old school feel without feeling outdated. Here is what you will find inside:\n\n"
            "• Dozens of machines including racing, shooters, claw games, air hockey, basketball, and more\n"
            "• Neon lights, immersive sounds, and a buzzing atmosphere\n"
            "• VR Arcade Games\n\n"
            "Whether you are aiming for the prize counter or just here for the fun, our Leicester arcade has something that will keep you coming back."
        ),
        "location_info": (
            "Spin Pin Arcade is right in the heart of Leicester city centre. "
            "Ramdoot House, First Floor – 2/3 Navigation Street, Leicester, LE1 3UR."
        ),
    },
]

print("\n" + "=" * 60)
print("  SEEDING ACTIVITY DETAIL FIELDS")
print("=" * 60)

updated = 0
not_found = 0

for data in ACTIVITY_DATA:
    slug = data["slug"]
    try:
        activity = Activity.objects.get(slug=slug)
        activity.why_choose_us = data["why_choose_us"]
        activity.what_to_expect = data["what_to_expect"]
        activity.location_info = data["location_info"]
        activity.save(update_fields=["why_choose_us", "what_to_expect", "location_info"])
        updated += 1
        print(f"  ✓ Updated  → {activity.name}")
    except Activity.DoesNotExist:
        not_found += 1
        print(f"  ✗ Not found → slug='{slug}' (run seed_activities first or check slug)")
    except Exception as e:
        not_found += 1
        print(f"  ✗ Error    → {slug}: {e}")

print("\n" + "=" * 60)
print(f"  Updated:   {updated}")
print(f"  Not found: {not_found}")
print("=" * 60)
print("\nActivities now have full 'Learn More' content on the Attractions page.\n")
