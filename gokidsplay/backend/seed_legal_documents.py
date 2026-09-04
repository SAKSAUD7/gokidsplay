"""
Seed all legal documents for the SpinPin Guidelines page.
Run with:
    python manage.py shell < seed_legal_documents.py

This populates: Terms & Conditions, Privacy Policy, Disclaimer,
Cookies Policy, Your Rights, and Security — matching the
fallback content in GuidelinesContent.tsx.
"""

from apps.cms.models import LegalDocument

LEGAL_DOCS = [
    {
        "document_type": "TERMS",
        "title": "Terms & Conditions",
        "intro": "Please read these terms carefully before visiting Spin Pin Leicester.",
        "sections": [
            {
                "title": "General Rules",
                "content": "• Only paid and authorised members of public are allowed into our premises. SpinPin reserves the right to refuse entry; you may be asked to leave for noncompliance of the rules.\n• In the interest of safety you may be refused entry if found under the influence of alcohol or drugs.\n• Adults must remain on the premises and supervise the child/children under their care at all times.\n• Paid parking available on site. Pay at reception and enter your vehicle registration.\n• We operate a no-refund policy after 10 minutes of admission.\n• We operate no compensation / refund policy for unavailability of our activity.\n• Our premises and all activities are subject to availability and safety checks. The management reserves the right to close the premises or any activity at any time without prior notice.\n• Please inform us if you or your child has any sort of accident, however minor – one of our qualified first aiders can assess/attend to the injury.\n• We accept no liability for the loss or damage to any valuables.\n• Children and adults must not run around the area.\n• Children and adults must not skate on the carpeted area, arcade, or bowling area.\n• Skates must not be worn in the toilets, bowling or arcade area.\n• We have a zero-tolerance policy to all forms of anti-social behaviour. This includes: bullying, fighting, any form of aggressive behaviour, or any other type of behaviour deemed to be unsuitable towards SpinPin staff, management, or other members of the public. You may be asked to leave following noncompliance and management reserve the right to enforce total bans.\n• You must not carry any sharp objects or weapons into our premises and it is forbidden to bring or consume alcohol or drugs; such items will be confiscated and you will be removed from the premises immediately. Where appropriate, we will contact the police."
            },
            {
                "title": "Food & Drinks",
                "content": "• Only food and drinks purchased at SpinPin can be consumed on the premises.\n• Waiting time for food during our peak periods can be up to 45 minutes.\n• No food or drinks are allowed in the skating area."
            },
            {
                "title": "Health & Safety",
                "content": "• In the interest of Health & Safety please ensure that children do not discard their food on the floor; any food debris fallen on the floor whilst eating must be removed immediately. Our staff members are available to provide additional help to maintain the hygiene of the centre.\n• In the interest of Health & Safety you must inform the management of any toiletry accidents or body fluids such as urine or vomit.\n• We provide nappy changing facilities and nappy changes must be carried out in the designated area. Please ensure soiled nappies are placed in the bins provided.\n• Shoes must be worn at all times when using toilet facilities.\n• All activities are subject to availability. Management reserves the right to close an activity if required without prior notice. No refunds or deductions will be made.\n• All venue is designed for maximum fun and has passed stringent requirements regulated by the Play Inspectors. We cannot therefore be held responsible for accidents which occur as a result of using our facility."
            },
            {
                "title": "Participant Waiver – Acknowledgement of Risks",
                "content": "I understand that roller skating and related activities involve inherent risks, including but not limited to falls, collisions, injuries or even death caused by the venue environment or other participants. I acknowledge that roller skating is a physically demanding activity and may result in serious injury, including fractures, sprains, head injuries, and other health complications."
            },
            {
                "title": "Assumption of Risk",
                "content": "By participating in roller skating activities at Spin Pin, I voluntarily assume all risks associated with these activities, whether known or unknown, foreseeable or unforeseeable, including injury to myself or others, and damage to property. I am fully responsible for my actions while participating and acknowledge that I am free to stop skating at any time if I feel unsafe or uncomfortable."
            },
            {
                "title": "Waiver and Release",
                "content": "In consideration for being permitted to participate in roller skating and related activities at Spin Pin, I hereby release, discharge, and agree to hold harmless Spin Pin, its owners, employees, agents, contractors, volunteers, and affiliates from any and all claims, demands, causes of action, or liabilities for personal injury, death, or property damage arising out of my participation in roller skating activities."
            },
            {
                "title": "Health and Safety (Waiver)",
                "content": "I affirm that I am physically capable of engaging in roller skating activities. I do not suffer from any medical condition that would make my participation unsafe. If I experience any medical condition, injury, or pain while participating in roller skating, I will immediately cease participating and inform venue staff.\nI understand that the use of appropriate safety gear, including wrist guards, knee pads, elbow pads, and helmets, is recommended but not required."
            },
            {
                "title": "Compliance with Venue Rules",
                "content": "I agree to follow all posted rules and regulations of Spin Pin and to comply with any instructions given by the staff or personnel. I understand that failure to adhere to these rules or behave in an unsafe or disruptive manner may result in my removal from the venue without refund."
            },
            {
                "title": "Photo and Video Consent",
                "content": "I grant permission to Spin Pin to take photos and/or video recordings of my participation in roller skating activities, which may be used for promotional, marketing, or other business purposes. I waive any right to compensation or royalties regarding such use."
            },
            {
                "title": "Minors",
                "content": "If the participant is under the age of 16, this waiver must be signed by a parent or legal guardian, who agrees to accept full responsibility for the safety and well-being of the minor participant and assumes all risks outlined in this document."
            },
            {
                "title": "Severability",
                "content": "If any part of this waiver is determined to be invalid, illegal, or unenforceable, the remainder of the waiver shall continue in full force and effect."
            },
        ],
    },
    {
        "document_type": "PRIVACY",
        "title": "Privacy Policy",
        "intro": "Spin Pin Limited is the owner and operator of this website. This page informs you of our policies regarding the collection, use and disclosure of Personal Information we receive from users of the Site. By visiting our website you are accepting and consenting to the practices described in this policy.\n\nFor the purpose of the Data Protection Act 1998 (the Act), the data controller is Spin Pin Limited, a Company Registered address 21 High View Close, Hamilton, Leicester, Leicestershire LE4 9LJ.",
        "sections": [
            {
                "title": "Collection Of Information",
                "content": "We may collect and process the following information about you:\n\nYou may give us information about you by filling in forms or by corresponding with us by phone, e-mail or otherwise. This includes information you provide when you register to use our membership cards, subscribe to our service, place a booking, enter a competition, promotion or survey and when you report a problem with our site.\n\nThe information you give us may include your name, date of birth, address, e-mail address and phone number, financial and credit card information, personal description and photograph. You may also provide us with your child's name, date of birth and likes or any information in connection with your child."
            },
            {
                "title": "Information We Collect About You",
                "content": "With regard to each of your visits to our site we may automatically collect the following information:\n\n• Technical information, including the Internet protocol (IP) address used to connect your computer to the Internet, your login information, browser type and version, time zone setting, browser plug-in types and versions, operating system and platform.\n\n• Information about your visit, including the full Uniform Resource Locators (URL) click stream to, through and from our site (including date and time); products you viewed or searched for; page response times, download errors, length of visits to certain pages, page interaction information (such as scrolling, clicks, and mouse-overs), and methods used to browse away from the page.\n\n• Information we receive from other sources. We may receive information about you if you use any of the other websites we operate or the other services we provide. We are also working closely with third parties (including business partners, sub-contractors in technical, payment and delivery services, advertising networks, analytics providers, search information providers, and credit reference agencies) and may receive information about you from them."
            },
            {
                "title": "Use Of Information",
                "content": "We use your Personal Information for providing and improving the Site, administrative and marketing purposes. By submitting your information, you agree and consent to the collection and use of your information in accordance with this policy.\n\nWe may use your Personal Information to contact you with newsletters, emails or SMS with marketing or promotional materials, unless you exercise your right, as detailed below."
            },
            {
                "title": "How We Use Your Information",
                "content": "• To carry out our obligations arising from any contracts entered into between you and us and to provide you with the information, products and services that you request from us.\n• To provide you with information about other goods and services we offer that are similar to those that you have already purchased or enquired about.\n• To provide you, or permit selected third parties to provide you, with information about goods or services we feel may interest you.\n• To notify you about changes to our service.\n• Use of CCTV images and footage for the monitoring of visitors and staff and for protection and detection of crime and disorder.\n• To administer our site and for internal operations, including troubleshooting, data analysis, testing, research, statistical and survey purposes.\n• To improve our site to ensure that content is presented in the most effective manner for you and for your computer.\n• To allow you to participate in interactive features of our service, when you choose to do so.\n• As part of our efforts to keep our site safe and secure.\n• To measure or understand the effectiveness of advertising we serve to you and others, and to deliver relevant advertising to you.\n• To make suggestions and recommendations to you and other users of our site about goods or services that may interest you or them."
            },
            {
                "title": "Disclosure Of Information",
                "content": "We may share your personal information with any member of our group, as defined in section 1159 of the UK Companies Act 2006.\n\nWe may share your information with selected third parties including:\n• Advertisers and advertising networks that require the data to select and serve relevant adverts to you and others.\n• Business partners, suppliers and sub-contractors for the performance of any contract we enter into with you.\n• Analytics and search engine providers that assist us in the improvement and optimisation of our site.\n\nWe may disclose your personal information to third parties if we are under a duty to disclose or share your personal data in order to comply with any legal obligation, or in order to enforce or apply our Terms and Conditions and other agreements; or to protect the rights, property, or safety of Spin Pin Ltd, our customers, or others."
            },
            {
                "title": "Storing Of Information",
                "content": "All information you provide to us is stored on our secure servers. By submitting your personal data, you agree to the transfer, storing or processing. We will take all steps reasonably necessary to ensure that all data is treated securely and in accordance with this policy. Any payment transactions will be encrypted using SSL technology.\n\nUnfortunately, the transmission of information via the internet is not completely secure. Although we will do our best to protect your personal data, we cannot guarantee the security of your data transmitted to our site; any transmission is at your own risk. Once we have received your information, we will use strict procedures and security features to try to prevent unauthorised access."
            },
            {
                "title": "Links To Other Websites",
                "content": "We use links to improve your experience of our website and to collect information and reviews to improve our products and services. We will always aim to make these links clear, so that you know you have left our website. However, please be aware that these websites are owned and run by other companies and organisations and we cannot accept responsibility for any information you choose to divulge to a linked website."
            },
        ],
    },
    {
        "document_type": "DISCLAIMER",
        "title": "Disclaimer",
        "intro": "",
        "sections": [
            {
                "title": "Liability Disclaimer",
                "content": "We are pleased to provide this facility to all our valued customers. Whilst we have attempted to make it as safe as possible, the very nature of children's play activity means accidents can occasionally happen.\n\nWe cannot therefore accept any responsibilities for injury to children or adults, damage, loss or theft to clothing or any other valuables while using our facilities or car park.\n\nParental/carer supervision of children in your care is imperative."
            },
        ],
    },
    {
        "document_type": "COOKIES",
        "title": "Cookies Policy",
        "intro": "",
        "sections": [
            {
                "title": "What Are Cookies?",
                "content": "Cookies are files with a small amount of data, which may include an anonymous unique identifier. Cookies are sent to your browser from a web site and stored on your computer's hard drive.\n\nLike many sites, we use \"cookies\" to collect information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Site."
            },
        ],
    },
    {
        "document_type": "YOUR_RIGHTS",
        "title": "Your Rights",
        "intro": "",
        "sections": [
            {
                "title": "Your Data Rights",
                "content": "You have the right to ask us not to process your personal data for marketing purposes or for the use of authorised third party purposes.\n\nYou can exercise your right to prevent such processing at any time by contacting us at info@spinpin.co.uk or by contacting us through the contact page on this website."
            },
        ],
    },
    {
        "document_type": "SECURITY",
        "title": "Security",
        "intro": "",
        "sections": [
            {
                "title": "Data Security",
                "content": "We are committed to ensuring that your information is secure. In order to prevent unauthorised access or disclosure, we have put in place suitable physical, electronic and managerial procedures to safeguard and secure the information we collect online.\n\nAll payment transactions are encrypted using SSL technology. Once we have received your information, we will use strict procedures and security features to try to prevent unauthorised access."
            },
        ],
    },
]

print("\n" + "="*60)
print("  SEEDING LEGAL DOCUMENTS FOR GUIDELINES PAGE")
print("="*60)

created = 0
updated = 0
skipped = 0

for doc_data in LEGAL_DOCS:
    doc_type = doc_data["document_type"]
    try:
        doc, was_created = LegalDocument.objects.get_or_create(  # type: ignore[attr-defined]
            document_type=doc_type,
            defaults={
                "title": doc_data["title"],
                "intro": doc_data["intro"],
                "sections": doc_data["sections"],
                "active": True,
            }
        )
        if was_created:
            created += 1
            print(f"  ✓ CREATED  → {doc_type}: {doc_data['title']}")
        else:
            # Update existing record to keep content fresh
            doc.title = doc_data["title"]
            doc.intro = doc_data["intro"]
            doc.sections = doc_data["sections"]
            doc.active = True
            doc.save()
            updated += 1
            print(f"  ↻ UPDATED  → {doc_type}: {doc_data['title']}")
    except Exception as e:
        skipped += 1
        print(f"  ✗ FAILED   → {doc_type}: {e}")

print("\n" + "="*60)
print(f"  ✓ Created:  {created}")
print(f"  ↻ Updated:  {updated}")
print(f"  ✗ Failed:   {skipped}")
print(f"  Total:      {created + updated + skipped}/{len(LEGAL_DOCS)}")
print("="*60)
print("\nAll legal documents are now editable from:")
print("  Admin CMS → Guidelines → Legal Documents\n")
