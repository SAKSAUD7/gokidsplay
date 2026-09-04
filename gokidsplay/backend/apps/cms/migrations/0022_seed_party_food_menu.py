from django.db import migrations

def seed_data(apps, schema_editor):
    MenuSection = apps.get_model('cms', 'MenuSection')
    
    # Section 1: Pre Plated
    MenuSection.objects.update_or_create(
        category="Pre Plated",
        defaults={
            "description": "For each participant",
            "items": ["Chocolate & Jam Sandwiches", "Chicken Nuggets", "Chillie Garlic Potato Shots", "Hot Potato Chips"],
            "color": "primary",
            "active": True,
            "order": 1
        }
    )
    
    # Section 2: Served as Buffet
    MenuSection.objects.update_or_create(
        category="Served as Buffet",
        defaults={
            "description": "",
            "items": ["Chicken or Veg Noodles", "Chicken or Veg fried rice"],
            "color": "secondary",
            "active": True,
            "order": 2
        }
    )

    # Section 3: Snacks
    MenuSection.objects.update_or_create(
        category="Snacks",
        defaults={
            "description": "",
            "items": ["Pop corn tubs X 2", "mini slush 1 per participant", "unlimited squash drink"],
            "color": "accent",
            "active": True,
            "order": 3
        }
    )

def remove_data(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ("cms", "0021_menusection_description"),
    ]

    operations = [
        migrations.RunPython(seed_data, remove_data),
    ]
