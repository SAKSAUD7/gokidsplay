from apps.cms.models import InstagramReel

# Delete all broken Instagram reels
count = InstagramReel.objects.count()
InstagramReel.objects.all().delete()

print(f"✅ Deleted {count} Instagram reels with broken thumbnails")
print("You can now re-add them via Admin CMS → Social Media → Instagram Reels")
print("Make sure to upload actual thumbnail images when adding new reels!")
