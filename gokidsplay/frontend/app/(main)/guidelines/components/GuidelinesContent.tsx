"use client";

import { useState } from "react";
import { ScrollReveal } from "@repo/ui";
import { FileText, HelpCircle, Shield, Lock, AlertCircle, Cookie, Info } from "lucide-react";

interface GuidelinesContentProps {
    hero?: {
        title: string;
        subtitle: string;
        image: string;
    };
    categories: any[];
    legalDocuments: any[];
    faqs: any[];
}

// ─── Hardcoded fallback content from gokidsplay.uk ───────────────────────────────

const FALLBACK_TERMS = {
    title: "Terms & Conditions",
    intro: "Please read these terms carefully before visiting Go Kids Play Leicester.",
    sections: [
        {
            title: "General Rules",
            content: `• Only paid and authorised members of public are allowed into our premises. Go Kids Play reserves the right to refuse entry; you may be asked to leave for noncompliance of the rules.
• In the interest of safety you may be refused entry if found under the influence of alcohol or drugs.
• Adults must remain on the premises and supervise the child/children under their care at all times.
• Paid parking available on site. Pay at reception and enter your vehicle registration.
• We operate a no-refund policy after 10 minutes of admission.
• We operate no compensation / refund policy for unavailability of our activity.
• Our premises and all activities are subject to availability and safety checks. The management reserves the right to close the premises or any activity at any time without prior notice.
• Please inform us if you or your child has any sort of accident, however minor – one of our qualified first aiders can assess/attend to the injury.
• We accept no liability for the loss or damage to any valuables.
• Children and adults must not run around the area.
• Children and adults must not skate on the carpeted area, arcade, or bowling area.
• Skates must not be worn in the toilets, bowling or arcade area.
• We have a zero-tolerance policy to all forms of anti-social behaviour. This includes: bullying, fighting, any form of aggressive behaviour, or any other type of behaviour deemed to be unsuitable towards Go Kids Play staff, management, or other members of the public. You may be asked to leave following noncompliance and management reserve the right to enforce total bans.
• You must not carry any sharp objects or weapons into our premises and it is forbidden to bring or consume alcohol or drugs; such items will be confiscated and you will be removed from the premises immediately. Where appropriate, we will contact the police.`,
        },
        {
            title: "Food & Drinks",
            content: `• Only food and drinks purchased at Go Kids Play can be consumed on the premises.
• Waiting time for food during our peak periods can be up to 45 minutes.
• No food or drinks are allowed in the skating area.`,
        },
        {
            title: "Health & Safety",
            content: `• In the interest of Health & Safety please ensure that children do not discard their food on the floor; any food debris fallen on the floor whilst eating must be removed immediately. Our staff members are available to provide additional help to maintain the hygiene of the centre.
• In the interest of Health & Safety you must inform the management of any toiletry accidents or body fluids such as urine or vomit.
• We provide nappy changing facilities and nappy changes must be carried out in the designated area. Please ensure soiled nappies are placed in the bins provided.
• Shoes must be worn at all times when using toilet facilities.
• All activities are subject to availability. Management reserves the right to close an activity if required without prior notice. No refunds or deductions will be made.
• All venue is designed for maximum fun and has passed stringent requirements regulated by the Play Inspectors. We cannot therefore be held responsible for accidents which occur as a result of using our facility.`,
        },
        {
            title: "Participant Waiver – Acknowledgement of Risks",
            content: `I understand that roller skating and related activities involve inherent risks, including but not limited to falls, collisions, injuries or even death caused by the venue environment or other participants. I acknowledge that roller skating is a physically demanding activity and may result in serious injury, including fractures, sprains, head injuries, and other health complications.`,
        },
        {
            title: "Assumption of Risk",
            content: `By participating in roller skating activities at Go Kids Play, I voluntarily assume all risks associated with these activities, whether known or unknown, foreseeable or unforeseeable, including injury to myself or others, and damage to property. I am fully responsible for my actions while participating and acknowledge that I am free to stop skating at any time if I feel unsafe or uncomfortable.`,
        },
        {
            title: "Waiver and Release",
            content: `In consideration for being permitted to participate in roller skating and related activities at Go Kids Play, I hereby release, discharge, and agree to hold harmless Go Kids Play, its owners, employees, agents, contractors, volunteers, and affiliates from any and all claims, demands, causes of action, or liabilities for personal injury, death, or property damage arising out of my participation in roller skating activities.`,
        },
        {
            title: "Health and Safety (Waiver)",
            content: `I affirm that I am physically capable of engaging in roller skating activities. I do not suffer from any medical condition that would make my participation unsafe. If I experience any medical condition, injury, or pain while participating in roller skating, I will immediately cease participating and inform venue staff.
I understand that the use of appropriate safety gear, including wrist guards, knee pads, elbow pads, and helmets, is recommended but not required.`,
        },
        {
            title: "Compliance with Venue Rules",
            content: `I agree to follow all posted rules and regulations of Go Kids Play and to comply with any instructions given by the staff or personnel. I understand that failure to adhere to these rules or behave in an unsafe or disruptive manner may result in my removal from the venue without refund.`,
        },
        {
            title: "Photo and Video Consent",
            content: `I grant permission to Go Kids Play to take photos and/or video recordings of my participation in roller skating activities, which may be used for promotional, marketing, or other business purposes. I waive any right to compensation or royalties regarding such use.`,
        },
        {
            title: "Minors",
            content: `If the participant is under the age of 16, this waiver must be signed by a parent or legal guardian, who agrees to accept full responsibility for the safety and well-being of the minor participant and assumes all risks outlined in this document.`,
        },
        {
            title: "Severability",
            content: `If any part of this waiver is determined to be invalid, illegal, or unenforceable, the remainder of the waiver shall continue in full force and effect.`,
        },
    ],
};

const FALLBACK_PRIVACY = {
    title: "Privacy Policy",
    intro: "Go Kids Play Limited is the owner and operator of this website. This page informs you of our policies regarding the collection, use and disclosure of Personal Information we receive from users of the Site. By visiting our website you are accepting and consenting to the practices described in this policy.\n\nFor the purpose of the Data Protection Act 1998 (the Act), the data controller is Go Kids Play Limited, a Company Registered address 21 High View Close, Hamilton, Leicester, Leicestershire LE4 9LJ.",
    sections: [
        {
            title: "Collection Of Information",
            content: `We may collect and process the following information about you:

You may give us information about you by filling in forms or by corresponding with us by phone, e-mail or otherwise. This includes information you provide when you register to use our membership cards, subscribe to our service, place a booking, enter a competition, promotion or survey and when you report a problem with our site.

The information you give us may include your name, date of birth, address, e-mail address and phone number, financial and credit card information, personal description and photograph. You may also provide us with your child's name, date of birth and likes or any information in connection with your child.`,
        },
        {
            title: "Information We Collect About You",
            content: `With regard to each of your visits to our site we may automatically collect the following information:

• Technical information, including the Internet protocol (IP) address used to connect your computer to the Internet, your login information, browser type and version, time zone setting, browser plug-in types and versions, operating system and platform.

• Information about your visit, including the full Uniform Resource Locators (URL) click stream to, through and from our site (including date and time); products you viewed or searched for; page response times, download errors, length of visits to certain pages, page interaction information (such as scrolling, clicks, and mouse-overs), and methods used to browse away from the page.

• Information we receive from other sources. We may receive information about you if you use any of the other websites we operate or the other services we provide. We are also working closely with third parties (including business partners, sub-contractors in technical, payment and delivery services, advertising networks, analytics providers, search information providers, and credit reference agencies) and may receive information about you from them.`,
        },
        {
            title: "Use Of Information",
            content: `We use your Personal Information for providing and improving the Site, administrative and marketing purposes. By submitting your information, you agree and consent to the collection and use of your information in accordance with this policy.

We may use your Personal Information to contact you with newsletters, emails or SMS with marketing or promotional materials, unless you exercise your right, as detailed below.`,
        },
        {
            title: "How We Use Your Information",
            content: `• To carry out our obligations arising from any contracts entered into between you and us and to provide you with the information, products and services that you request from us.
• To provide you with information about other goods and services we offer that are similar to those that you have already purchased or enquired about.
• To provide you, or permit selected third parties to provide you, with information about goods or services we feel may interest you.
• To notify you about changes to our service.
• Use of CCTV images and footage for the monitoring of visitors and staff and for protection and detection of crime and disorder.
• To administer our site and for internal operations, including troubleshooting, data analysis, testing, research, statistical and survey purposes.
• To improve our site to ensure that content is presented in the most effective manner for you and for your computer.
• To allow you to participate in interactive features of our service, when you choose to do so.
• As part of our efforts to keep our site safe and secure.
• To measure or understand the effectiveness of advertising we serve to you and others, and to deliver relevant advertising to you.
• To make suggestions and recommendations to you and other users of our site about goods or services that may interest you or them.`,
        },
        {
            title: "Disclosure Of Information",
            content: `We may share your personal information with any member of our group, as defined in section 1159 of the UK Companies Act 2006.

We may share your information with selected third parties including:
• Advertisers and advertising networks that require the data to select and serve relevant adverts to you and others.
• Business partners, suppliers and sub-contractors for the performance of any contract we enter into with you.
• Analytics and search engine providers that assist us in the improvement and optimisation of our site.

We may disclose your personal information to third parties if we are under a duty to disclose or share your personal data in order to comply with any legal obligation, or in order to enforce or apply our Terms and Conditions and other agreements; or to protect the rights, property, or safety of Go Kids Play Ltd, our customers, or others.`,
        },
        {
            title: "Storing Of Information",
            content: `All information you provide to us is stored on our secure servers. By submitting your personal data, you agree to the transfer, storing or processing. We will take all steps reasonably necessary to ensure that all data is treated securely and in accordance with this policy. Any payment transactions will be encrypted using SSL technology.

Unfortunately, the transmission of information via the internet is not completely secure. Although we will do our best to protect your personal data, we cannot guarantee the security of your data transmitted to our site; any transmission is at your own risk. Once we have received your information, we will use strict procedures and security features to try to prevent unauthorised access.`,
        },
        {
            title: "Links To Other Websites",
            content: `We use links to improve your experience of our website and to collect information and reviews to improve our products and services. We will always aim to make these links clear, so that you know you have left our website. However, please be aware that these websites are owned and run by other companies and organisations and we cannot accept responsibility for any information you choose to divulge to a linked website.`,
        },
    ],
};

const FALLBACK_DISCLAIMER = {
    title: "Disclaimer",
    intro: "",
    sections: [
        {
            title: "Liability Disclaimer",
            content: `We are pleased to provide this facility to all our valued customers. Whilst we have attempted to make it as safe as possible, the very nature of children's play activity means accidents can occasionally happen.

We cannot therefore accept any responsibilities for injury to children or adults, damage, loss or theft to clothing or any other valuables while using our facilities or car park.

Parental/carer supervision of children in your care is imperative.`,
        },
    ],
};

const FALLBACK_COOKIES = {
    title: "Cookies Policy",
    intro: "",
    sections: [
        {
            title: "What Are Cookies?",
            content: `Cookies are files with a small amount of data, which may include an anonymous unique identifier. Cookies are sent to your browser from a web site and stored on your computer's hard drive.

Like many sites, we use "cookies" to collect information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Site.`,
        },
    ],
};

const FALLBACK_RIGHTS = {
    title: "Your Rights",
    intro: "",
    sections: [
        {
            title: "Your Data Rights",
            content: `You have the right to ask us not to process your personal data for marketing purposes or for the use of authorised third party purposes.

You can exercise your right to prevent such processing at any time by contacting us at info@gokidsplay.co.uk or by contacting us through the contact page on this website.`,
        },
    ],
};

const FALLBACK_SECURITY = {
    title: "Security",
    intro: "",
    sections: [
        {
            title: "Data Security",
            content: `We are committed to ensuring that your information is secure. In order to prevent unauthorised access or disclosure, we have put in place suitable physical, electronic and managerial procedures to safeguard and secure the information we collect online.

All payment transactions are encrypted using SSL technology. Once we have received your information, we will use strict procedures and security features to try to prevent unauthorised access.`,
        },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────

export default function GuidelinesContent({ hero, categories, legalDocuments, faqs }: GuidelinesContentProps) {
    const [activeTab, setActiveTab] = useState<string>("faqs");

    const tabs = [
        { id: "faqs", label: "FAQs", icon: HelpCircle, count: faqs?.length || 0 },
        { id: "terms", label: "Terms & Conditions", icon: FileText },
        { id: "privacy", label: "Privacy Policy", icon: Shield },
        { id: "disclaimer", label: "Disclaimer", icon: Info },
        { id: "cookies", label: "Cookies", icon: Cookie },
        { id: "rights", label: "Your Rights", icon: AlertCircle },
        { id: "security", label: "Security", icon: Lock },
    ];

    const getLegalDoc = (type: string) => {
        return legalDocuments?.find((doc: any) => doc.document_type === type.toUpperCase());
    };

    // Use API data if available, otherwise fall back to static content
    const termsDoc = getLegalDoc("terms") || FALLBACK_TERMS;
    const privacyDoc = getLegalDoc("privacy") || FALLBACK_PRIVACY;
    const disclaimerDoc = getLegalDoc("disclaimer") || FALLBACK_DISCLAIMER;
    const cookiesDoc = getLegalDoc("cookies") || FALLBACK_COOKIES;
    const rightsDoc = getLegalDoc("your_rights") || FALLBACK_RIGHTS;
    const securityDoc = getLegalDoc("security") || FALLBACK_SECURITY;

    const renderDocSection = (doc: any, accentColor: string = "primary") => (
        <div>
            <h2 className="text-3xl font-bold mb-4 text-white">{doc.title}</h2>
            {doc.intro && (
                <p className="text-white/70 mb-6 italic border-l-4 border-white/20 pl-4 whitespace-pre-line">{doc.intro}</p>
            )}
            {doc.sections && doc.sections.length > 0 ? (
                <div className="space-y-6">
                    {doc.sections.map((section: any, index: number) => (
                        <div key={index} className="group">
                            <h3 className={`text-xl font-bold text-${accentColor} mb-3`}>{section.title}</h3>
                            <div className={`text-white/70 whitespace-pre-line pl-4 border-l-2 border-${accentColor}/30 leading-relaxed`}>
                                {section.content}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-white/60">Content not available.</p>
            )}
        </div>
    );

    return (
        <main className="min-h-screen bg-background text-white">
            {/* Header */}
            <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 bg-gradient-to-b from-background-dark to-background">
                <div className="max-w-7xl mx-auto text-center">
                    <ScrollReveal animation="fade">
                        <span className="inline-block py-1 px-3 rounded-full bg-accent text-white font-bold text-sm mb-6 tracking-wider uppercase">
                            Information &amp; Support
                        </span>
                    </ScrollReveal>
                    <ScrollReveal animation="slideUp" delay={0.2}>
                        <h1 className="text-5xl md:text-6xl lg:text-8xl font-display font-black mb-6 leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                {hero?.title || "Safety Guidelines"}
                            </span>
                        </h1>
                        <p className="text-base md:text-xl lg:text-2xl text-white/70 max-w-3xl mx-auto">
                            {hero?.subtitle || "Your safety is our priority. Please read our guidelines before your visit to Go Kids Play Leicester."}
                        </p>
                    </ScrollReveal>
                </div>
            </section>

            {/* Tabbed Content */}
            <section className="py-12 md:py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-semibold transition-all ${activeTab === tab.id
                                        ? "bg-primary text-black"
                                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-black/20 rounded-full text-xs">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-surface-800/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-8">

                        {/* FAQs Tab */}
                        {activeTab === "faqs" && (
                            <div>
                                <h2 className="text-3xl font-bold mb-6 text-white">Frequently Asked Questions</h2>
                                {faqs && faqs.length > 0 ? (
                                    <div className="space-y-4">
                                        {faqs.map((faq: any, index: number) => (
                                            <details key={faq.id || index} className="group bg-white/5 rounded-lg p-4 border border-white/10">
                                                <summary className="cursor-pointer font-semibold text-lg text-white hover:text-primary transition-colors flex items-center gap-2">
                                                    <span className="group-open:rotate-90 transition-transform">▶</span>
                                                    {faq.question}
                                                </summary>
                                                <p className="mt-3 ml-6 text-white/70 whitespace-pre-line">
                                                    {faq.answer}
                                                </p>
                                            </details>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-white/60">No FAQs available at the moment.</p>
                                )}
                            </div>
                        )}

                        {/* Terms Tab */}
                        {activeTab === "terms" && renderDocSection(termsDoc, "primary")}

                        {/* Privacy Tab */}
                        {activeTab === "privacy" && renderDocSection(privacyDoc, "secondary")}

                        {/* Disclaimer Tab */}
                        {activeTab === "disclaimer" && renderDocSection(disclaimerDoc, "accent")}

                        {/* Cookies Tab */}
                        {activeTab === "cookies" && renderDocSection(cookiesDoc, "primary")}

                        {/* Your Rights Tab */}
                        {activeTab === "rights" && renderDocSection(rightsDoc, "accent")}

                        {/* Security Tab */}
                        {activeTab === "security" && renderDocSection(securityDoc, "primary")}
                    </div>
                </div>
            </section>
        </main>
    );
}
