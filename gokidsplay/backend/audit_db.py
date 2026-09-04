import os, sys, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'ninja_backend.settings'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.bookings.models import Booking, PartyBooking, Customer, Waiver, BookingBlock
from apps.payments.models import Payment
from apps.cms.models import StatCard, Banner, GalleryItem, Activity, Faq, PageSection, ContactMessage
from apps.shop.models import Voucher
from apps.core.models import GlobalSettings, Logo, Notification
from django.db.models import Count

print("=== DATABASE RECORD COUNTS ===")
print(f"Customers: {Customer.objects.count()}")
print(f"Session Bookings: {Booking.objects.count()}")
print(f"Party Bookings: {PartyBooking.objects.count()}")
print(f"Waivers: {Waiver.objects.count()}")
print(f"Payments: {Payment.objects.count()}")
print(f"Booking Blocks: {BookingBlock.objects.count()}")
print(f"Vouchers: {Voucher.objects.count()}")
print(f"GlobalSettings: {GlobalSettings.objects.count()}")
print(f"Logos: {Logo.objects.count()}")
print(f"Notifications: {Notification.objects.count()}")
print(f"Activities (CMS): {Activity.objects.count()}")
print(f"FAQs: {Faq.objects.count()}")
print(f"Banners: {Banner.objects.count()}")
print(f"StatCards: {StatCard.objects.count()}")
print(f"PageSections: {PageSection.objects.count()}")
print(f"GalleryItems: {GalleryItem.objects.count()}")
print(f"ContactMessages: {ContactMessage.objects.count()}")

print()
print("=== ACTIVITY BREAKDOWN (Session Bookings) ===")
activities = Booking.objects.values('activity').annotate(count=Count('id'))
for a in activities:
    print(f"  {a['activity'] or 'None'}: {a['count']}")

print()
print("=== INSTALLED APPS ===")
from django.conf import settings
for app in settings.INSTALLED_APPS:
    if app.startswith('apps.'):
        print(f"  {app}")

print()
print("=== CMS PAGE SECTIONS ===")
for ps in PageSection.objects.values('page_key', 'section_key'):
    print(f"  {ps['page_key']} / {ps['section_key']}")
