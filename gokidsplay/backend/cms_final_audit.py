"""Final CMS audit — print counts of every model"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.cms.models import (
    Page, PageSection, Banner, Activity, Faq, StatCard,
    SocialLink, GalleryItem, PartyPackage, GroupPackage,
    GuidelineCategory, ContactInfo, MenuSection, TimingCard,
    BookingInformation, LegalDocument
)

def show(model, extra=""):
    qs = model.objects.filter(active=True) if hasattr(model, 'active') else model.objects.all()
    print(f"  {model.__name__:<25} {qs.count():>3} active records  {extra}")

print("=== CMS MODEL COUNTS ===")
show(Page)
show(PageSection)
show(Activity)
show(Faq)
show(StatCard)
show(SocialLink)
show(GalleryItem)
show(PartyPackage)
show(GroupPackage)
show(GuidelineCategory)
show(ContactInfo)
show(MenuSection)
show(TimingCard)
show(BookingInformation)
show(LegalDocument)

try:
    from apps.cms.models import TimelineItem
    show(TimelineItem)
except: pass

try:
    from apps.cms.models import ValueItem
    show(ValueItem)
except: pass

try:
    from apps.cms.models import InstagramReel
    show(InstagramReel)
except: pass

print("\n=== PAGE SECTIONS DETAIL ===")
for ps in PageSection.objects.all().order_by('page', 'order'):
    img = ps.image_url[:40] if ps.image_url else "(no image)"
    print(f"  [{ps.page}/{ps.section_key}] title={ps.title[:30] if ps.title else '?'} | img={img}")

print("\n=== GALLERY IMAGES ===")
for g in GalleryItem.objects.all().order_by('order'):
    print(f"  [{g.category}] {g.title} -> {g.image_url}")
