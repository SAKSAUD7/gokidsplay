
import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.cms.models import PageSection

def update_party_terms():
    new_terms_content = """
            <ol class="list-decimal pl-5 space-y-2">
                <li>50% Non-Refundable Deposit Confirms Your Booking.</li>
                <li>Minimum Participants 10.</li>
                <li>Balance Should Be Paid Before The Party Begins On The Day.</li>
                <li>No Refund Is Authorised For Cancellation. However, Only 1 Date Change /Reschedule Is Permitted Subject To Availability And Notice Must Be Given 2 Weeks Before The Booked Party Date.</li>
                <li>Rescheduling Party With 2 Weeks Before Party Date Is Free. It Can Be Changed By Managing Your Booking.</li>
                <li>Rescheduling Less Than 2 Weeks From Party Date Is Rs 1000 Admin Charge Apply.</li>
                <li>Balance In Full Including Any Additional Participant Or Spectator Fee Or Extras Must Be Paid Before Your Party Starts.</li>
                <li>Additional Participants And Spectators Are Charged Extra Per Person.</li>
                <li>Entry For Party Is For Invited Guests Only. Any Accompanying Children Or Additional Adults Must Pay Upon Entry If They Wish To Join The Party Or Wait Inside The Building. It Is The Party Host Responsibility To Ensure Payment Is Complete.</li>
                <li>No Sprinklers Candles, Flower Pot Candles Are Allowed. Please Reduce The Number Of Candles You Use On Your Cake, A Numbered Candle Is Preferred. No Party Poppers Or Confetti Items Allowed.</li>
                <li>Party Will Last For Approx. 2 Hours. Approx. 75 Minutes Of Play And 45 Minutes Oi Party Time In The Party Area.</li>
                <li>All Party Guests Must Leave The Party Room / Area At The End Of The Party Time. Any Additional Time In The Party Area/ Room Will Be Charged Rs 100 For Every 10 Minutes.</li>
                <li>Party Staff Is Available To Help You Run Your Party Smoothly And Not For Entertainment Purpose. All Party Feast And Play Equipment's Are Subject To Availability.</li>
                <li>Activities Will Be Closed With 10mins Prior Notice. Compensation Or Refund Will Not Be Authorised For Such Events.</li>
                <li>All Participants Must Sign A Waiver Prior To Participating. Party Host Must Ensure The Waiver Are Complete For Their Invited Guest Participants.</li>
                <li>Rules And Terms & Conditions Apply At All Times. Visit Www.Ninjainflatable.Com For Full List Of T&C & Rules Of Play.</li>
                <li>By Receiving The Confirmation Email Or By Signing The Booking Form You Agree To Abide By The Above-Mentioned Terms.</li>
            </ol>
    """

    try:
        # Try to get the existing section
        section = PageSection.objects.get(page='party-booking', section_key='terms')
        print(f"Found existing section 'terms' for page 'party-booking'. Updating...")
        section.content = new_terms_content
        section.save()
        print("Successfully updated Party Terms & Conditions.")
        
    except PageSection.DoesNotExist:
        print("Section not found. Creating new section...")
        PageSection.objects.create(
            page='party-booking',
            section_key='terms',
            title='Parties Terms & Conditions',
            content=new_terms_content,
            active=True,
            order=1
        )
        print("Successfully created Party Terms & Conditions.")

if __name__ == '__main__':
    update_party_terms()
