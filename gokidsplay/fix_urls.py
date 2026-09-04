import os
import sys
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from apps.cms.models import PageSection, Activity, GalleryItem, Banner, PartyPackage

def fix_urls():
    # Replace in PageSection
    for section in PageSection.objects.all():
        updated = False
        if section.image_url and 'http://localhost:9000' in section.image_url:
            section.image_url = section.image_url.replace('http://localhost:9000', '')
            updated = True
        if section.video_url and 'http://localhost:9000' in section.video_url:
            section.video_url = section.video_url.replace('http://localhost:9000', '')
            updated = True
        if updated:
            section.save()
            print(f"Updated PageSection: {section.section_key}")

    # Fix other models with CharField URLs if any, but most are ImageField.
    # ImageField values in DB are relative paths (e.g., 'uploads/...'), but if they got saved with absolute URL somehow:
    for model_class in [Activity, GalleryItem, Banner, PartyPackage]:
        for obj in model_class.objects.all():
            updated = False
            # Check if there's an image_url field (like PartyPackage or others might have)
            if hasattr(obj, 'image_url') and obj.image_url and 'http://localhost:9000' in obj.image_url:
                obj.image_url = obj.image_url.replace('http://localhost:9000', '')
                updated = True
            
            # For ImageFields, the DB value shouldn't contain the domain, but let's check
            if hasattr(obj, 'image') and obj.image and hasattr(obj.image, 'name'):
                name = obj.image.name
                if name and 'http://localhost:9000' in name:
                    # Clean up the DB name
                    clean_name = name.split('/media/')[-1] if '/media/' in name else name.replace('http://localhost:9000', '')
                    obj.image.name = clean_name
                    updated = True
            
            if updated:
                obj.save()
                print(f"Updated {model_class.__name__}: {obj.id}")

if __name__ == '__main__':
    fix_urls()
    print("Done fixing URLs!")
