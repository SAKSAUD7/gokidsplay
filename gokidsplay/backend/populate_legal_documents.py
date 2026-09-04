"""
Populate Legal Documents with SpinPin content
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.cms.models import LegalDocument

def create_legal_documents():
    """Create all legal documents"""
    
    # Terms & Conditions
    terms, created = LegalDocument.objects.update_or_create(
        document_type='TERMS',
        defaults={
            'title': 'Terms & Conditions',
            'intro': 'Please read these terms and conditions carefully before using our services.',
            'sections': [
                {
                    "title": "Entry and Admission",
                    "content": """• Only authorised members of public are allowed into our premises. SpinPin reserves the right to refuse entry, you may be asked to leave for noncompliance of the rules.
• In the interest of safety you may be refused entry if found under the influence of alcohol or drugs.
• Adults must remain on the premises and supervise the child/children under their care at all times.
• Play time is for the duration of the booked session only.
• We provide free car park for 2 hours. However, if the play is extended for more than 2 hrs the car registration number must be recorded at the reception to avoid parking penalty ticket. We accept no liability for parking penalties.
• All children of fee paying age (Under 18) and adults (18+) entering SpinPin must pay the entry fee, regardless of whether they will play or not.
• We operate a no-refund policy after 10 minutes of admission."""
                },
                {
                    "title": "Your Stay Whilst You Play",
                    "content": """• Please inform us if your child has any sort of accident, however minor – one of our qualified first aiders can assess/attend to the injury.
• Please inform a member of staff immediately should a child become lost in the play area
• We accept no liability for the loss or damage to any valuables.
• Children and adults must not run around the centre.
• We have a zero-tolerance policy to all forms of anti-social behaviour. This includes: bullying, fighting, any form of aggressive, or any other type of behaviour deemed to be unsuitable towards SpinPin Staff, management, or other members of the public – from either children or adults. You may be asked to leave following noncompliance and management reserve the right to enforce total bans.
• You must not carry any sharp objects or weapons into our premises and it is forbidden to bring or consume alcohol or drugs, such items will be confiscated and you will be removed from the premises immediately. Where appropriate, we will contact the police."""
                },
                {
                    "title": "Food & Drinks",
                    "content": """• Only food and drinks purchased at SpinPin can be consumed on the premises.
• Waiting time for food during our peak periods can be up to 45 minutes.
• We keep eating areas separated from the play area for matters of health and safety. Food, drink, sweets and chewing gum are not allowed in close proximity of play area"""
                },
                {
                    "title": "Health & Safety",
                    "content": """• In the interest of Health & Safety please ensure that children do not discard their food on the floor, any food debris fallen on the floor whilst eating must be removed immediately. Our staff members are available to provide additional help to maintain the hygiene of the centre.
• In the interest of Health & Safety you must inform the management of any toiletry accidents, body fluids such as urine, vomit caused by children on play equipment.
• We provide nappy changing facilities and nappy changes must be carried out in the designated area. Please ensure soiled nappies are placed in the bins provided.
• Shoes must be worn at all time when using toilet facilities."""
                },
                {
                    "title": "Play Time At SpinPin",
                    "content": """• All play equipment is subject to availability. Management reserves the right to close an activity if required without prior notice. No refunds or deductions will be made.
• All our play equipment is designed for maximum fun, and has passed stringent requirements regulated by the Play Inspectors. We cannot therefore be held responsible for accidents which occur as a result of playing on our equipment.
• We have provided separate age appropriate zones, for everyone's safety please adhere to all age and height restrictions.
• Children who are unwell should not use the play facilities.
• Children may be refused entry in the play area if they are not wearing appropriate clothing or footwear, if they do not meet the height restriction, if they are unwell, wearing plaster cast or have sustained injuries and when they do not follow rules of play and instructions.
• Staff at SpinPin will supervise the play area during operation to help maximise your children's play experience, they are not however a replacement for parental supervision"""
                }
            ],
            'active': True
        }
    )
    print(f"✓ {'Created' if created else 'Updated'} Terms & Conditions")
    
    # Privacy Policy
    privacy, created = LegalDocument.objects.update_or_create(
        document_type='PRIVACY',
        defaults={
            'title': 'Privacy Policy',
            'intro': 'Spin Pin Limited is the owner and operator of this website. This page informs you of our policies regarding the collection, use and disclosure of Personal Information we receive from users of the Site.',
            'sections': [
                {
                    "title": "Collection Of Information",
                    "content": """We may collect and process the following information data about you:

You may give us information about you by filling in forms or by corresponding with us by phone, e-mail or otherwise. This includes information you provide when you register to use our membership cards, subscribe to our service, place a Booking, enter a competition, promotion or survey and when you report a problem with our site.

The information you give us may include your name, date of birth, address, e-mail address and phone number, financial and credit card information, personal description and photograph. You may also provide us with your child's name, date of birth and likes or any information in connection with your child."""
                },
                {
                    "title": "Information We Collect About You",
                    "content": """With regard to each of your visits to our site we may automatically collect the following information:

• Technical information, including the Internet protocol (IP) address used to connect your computer to the Internet, your login information, browser type and version, time zone setting, browser plug-in types and versions, operating system and platform
• Information about your visit, including the full Uniform Resource Locators (URL) clickstream to, through and from our site (including date and time); products you viewed or searched for; page response times, download errors, length of visits to certain pages, page interaction information (such as scrolling, clicks, and mouse-overs), and methods used to browse away from the page
• Information we receive from other sources. We may receive information about you if you use any of the other websites we operate or the other services we provide"""
                },
                {
                    "title": "Use Of Information",
                    "content": """We use your Personal Information for providing and improving the Site, administrative and marketing purpose. By submitting your information, you agree and consent to the collection and use of your information for such purpose in accordance with this policy.

We may use your Personal Information to contact you with newsletters, emails or SMS with marketing or promotional materials, unless you exercise your right to opt out."""
                }
            ],
            'active': True
        }
    )
    print(f"✓ {'Created' if created else 'Updated'} Privacy Policy")
    
    # Your Rights
    rights, created = LegalDocument.objects.update_or_create(
        document_type='YOUR_RIGHTS',
        defaults={
            'title': 'Your Rights',
            'intro': 'Information regarding your rights',
            'sections': [
                {
                    "title": "Your Rights",
                    "content": """You have the right to ask us not to process your personal data for marketing purposes or for the use of authorised third party purposes.

You can exercise your right to prevent such processing at any time by contacting us at info@spinpin.co.uk or by contacting us through the contact page on this website."""
                }
            ],
            'active': True
        }
    )
    print(f"✓ {'Created' if created else 'Updated'} Your Rights")
    
    # Security
    security, created = LegalDocument.objects.update_or_create(
        document_type='SECURITY',
        defaults={
            'title': 'Security',
            'intro': 'Our handling of security',
            'sections': [
                {
                    "title": "Data Security",
                    "content": """The security of your Personal Information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure.

While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security."""
                }
            ],
            'active': True
        }
    )
    print(f"✓ {'Created' if created else 'Updated'} Security")

def main():
    print("=" * 60)
    print("POPULATING LEGAL DOCUMENTS")
    print("=" * 60)
    
    create_legal_documents()
    
    print("\n" + "=" * 60)
    print("✅ ALL LEGAL DOCUMENTS POPULATED!")
    print("=" * 60)

if __name__ == '__main__':
    main()
