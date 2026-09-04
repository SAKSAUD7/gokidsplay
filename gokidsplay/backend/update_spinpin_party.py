"""
Update party package with SpinPin content
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.cms.models import PartyPackage, PageSection

def update_party_content():
    """Update party package and page sections with SpinPin content"""
    
    # Delete existing party packages
    PartyPackage.objects.all().delete()
    print("✓ Deleted old party packages")
    
    # Create the SpinPin party package
    party_package = PartyPackage.objects.create(
        name="£250 Party Package",
        description="Looking for a fun way to celebrate? Our £250 Party Package is the perfect choice for UNDER 14s. This package includes everything you need for a great time: 2 hours of play and party time, roller skate rentals, a dedicated party area, and much more! Book your party today and get ready for a fantastic time!",
        price=250.00,
        min_participants=10,
        max_participants=None,
        duration=120,  # 2 hours total
        includes=[
            "Entry for 10 participants (Under 14s)",
            "Entry for 10 spectators (Non Skaters)",
            "Each additional participant £19.95",
            "Each additional spectator £2.95",
            "Free roller skate hire for the paid participants",
            "75 Minutes of roller skating",
            "45 Minutes use of Party Room",
            "Party Food for participants",
            "Unlimited squash drinks for participants",
            "Online Party Invitations",
            "Discount for other activities on the day (Bowling, VR, Pool Tables etc)"
        ],
        addons=[
            "Additional participant: £19.95",
            "Additional spectator: £2.95"
        ],
        popular=True,
        variant="primary",
        active=True,
        order=1
    )
    print(f"✓ Created party package: {party_package.name}")
    
    # Update hero section
    hero_section, created = PageSection.objects.update_or_create(
        page='party-booking',
        section_key='hero',
        defaults={
            'title': 'Spin Pin Party Booking',
            'content': "Celebrate with the ultimate adventure! Available from Thursday's to Sunday's",
            'order': 1
        }
    )
    print(f"✓ {'Created' if created else 'Updated'} hero section")
    
    # Update terms section with full T&C
    terms_html = """
<div class="space-y-3">
    <h3 class="text-xl font-bold text-primary mb-4">Party Feast Includes</h3>
    <ul class="list-disc list-inside space-y-1 mb-6">
        <li>Pizza</li>
        <li>Chicken Nuggets</li>
        <li>Onion Rings</li>
        <li>Garlic Bread</li>
        <li>Curly Fries</li>
        <li>Chips</li>
        <li>Slush</li>
        <li>Unlimited Squash</li>
        <li>We cater Vegetarian and Halal food options</li>
    </ul>
    
    <h3 class="text-xl font-bold text-primary mb-4">Party Terms & Conditions</h3>
    <ol class="list-decimal list-inside space-y-2 text-sm">
        <li>50% non refundable deposit confirms your booking.</li>
        <li>Minimum participants 10.</li>
        <li>Balance should be paid before going to party room, so that we can cook right amount of food for number of participants.</li>
        <li>No refund is authorised for cancellation. However, only 1 date change / reschedule is permitted subject to availability and notice must be given 2 weeks before the booked party date.</li>
        <li>Rescheduling party with 2 weeks before party date is free. It can be changed by managing your booking.</li>
        <li>Rescheduling less than 2 weeks from party date is £50 admin charge apply.</li>
        <li>Balance in full including any additional participant or spectator fee or extras must be paid before your party starts.</li>
        <li>Additional participants and spectators are charged extra per person.</li>
        <li>Entry for party is for invited guests only. Any accompanying children or additional adults must pay upon entry if they wish to join the party or wait inside the building. It is the party host responsibility to ensure payment is complete.</li>
        <li>It is the party hosts responsibility to check with their guests for any allergy information and the party host must inform us for any allergy or dietary requirements at the time of booking or atleast 2 days before the party date.</li>
        <li>We do not provide birthday cake, candles and are not able to refrigerate your cakes. The ingredients in the birthday cake including any allergy or dietary information must be provided to all invited guests by the party host. Due to Natasha's law we are not responsible for the ingredients present in the cake.</li>
        <li>No sprinklers candles, flower pot candles are allowed. Please reduce the number of candles you use on your cake, a numbered candle is preferred. No party poppers or confetti items allowed.</li>
        <li>Party will last for approx. 2 hours. Approx. 75 minutes of play and 45 minutes of party time in the party area.</li>
        <li>All party guests must leave the party room / area at the end of the party time. Any additional time in the party area/ room will be charged £5 for every 15 minutes.</li>
        <li>Party staff is available to help you run your party smoothly and not for entertainment purpose. All party feast and play equipment's are subject to availability.</li>
        <li>Activities may be closed without prior notice. Compensation or refund will not be authorised for such events.</li>
        <li>Party price is same for weekdays or weekend party (peak or off peak). However, the activities will operate as per their scheduled operating days only (peak and off peak activity condition applies).</li>
        <li>Restricted car park for 2 hours only, for extra parking time, please enters your correct car registration number at the reception. Maximum Car park stay 3 hours. We do not accept any liability for car park penalty charges.</li>
        <li>All participants must sign a waiver prior to participating. Party host must ensure the waiver are complete for their invited guest participants.</li>
        <li>Rules and terms & Conditions apply at all times. Visit www.spinpin.co.uk for full list of T&C & Rules of Play.</li>
        <li>By receiving the confirmation email or by signing the booking form you agree to abide by the above mentioned terms and authorise Spin Pin.</li>
    </ol>
</div>
"""
    
    terms_section, created = PageSection.objects.update_or_create(
        page='party-booking',
        section_key='terms',
        defaults={
            'title': 'Party Terms & Conditions',
            'content': terms_html,
            'order': 2
        }
    )
    print(f"✓ {'Created' if created else 'Updated'} terms section")
    
    print("\n✅ Party content updated successfully!")
    print(f"   - Package: £250 for 10 participants")
    print(f"   - Duration: 2 hours (75 min skating + 45 min party room)")
    print(f"   - Includes: 11 features")
    print(f"   - Full T&C added")

if __name__ == '__main__':
    update_party_content()
