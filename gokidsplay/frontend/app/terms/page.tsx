"use client";

import { ScrollReveal, SectionDivider } from "@repo/ui";
import { Shield, FileText, AlertCircle, Clock, Car, Utensils, Ban, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function TermsPage() {
    const [activeTab, setActiveTab] = useState("terms");

    const content = {
        terms: {
            title: "Terms & Conditions",
            sections: [
                {
                    title: "Opening Offer",
                    content: [
                        "Free Entry * T&C apply",
                        "The offer applies when you buy a 60 minute session the free entry for the upgrade will be automatically applied.",
                        "Offer valid on 22 and 23rd November"
                    ]
                },
                {
                    title: "General Rules",
                    content: [
                        "Only authorised members of the public are allowed into our premises.",
                        "Go Kids Play reserves the right to refuse entry, and you may be asked to leave for noncompliance with our rules.",
                        "In the interest of safety, entry may be refused if you are found under the influence of alcohol or drugs.",
                        "Adults must remain on the premises and supervise children under their care at all times.",
                        "Play time is limited to the duration of the booked session only.",
                        "We operate a no-refund policy after 10 minutes of admission."
                    ]
                },
                {
                    title: "Parking",
                    content: [
                        "Paid parking is available nearby (£3.00 per visit).",
                        "Please ensure your vehicle is parked legally and responsibly.",
                        "Go Kids Play accepts no liability for parking fines."
                    ]
                },
                {
                    title: "Entry Fees",
                    content: [
                        "All participants, both children and adults, must pay the entry fee, regardless of whether they actively play or accompany others."
                    ]
                }
            ]
        },
        rules: {
            title: "Rules & Guidelines",
            sections: [
                {
                    title: "Your Stay Whilst You Play",
                    content: [
                        "Please inform us immediately if any participant has an accident, however minor. Our qualified first aiders are available to assist.",
                        "If someone becomes separated from your group, please notify a member of staff immediately.",
                        "Go Kids Play accepts no liability for the loss or damage of valuables.",
                        "Participants must not run recklessly or behave in a way that endangers others.",
                        "We operate a zero-tolerance policy towards bullying, fighting, aggressive, or inappropriate behaviour towards staff, management, or other visitors.",
                        "Sharp objects, weapons, alcohol, or drugs are strictly prohibited. Such items will be confiscated and the individual removed immediately. Where appropriate, the police will be contacted."
                    ]
                },
                {
                    title: "Food & Drinks",
                    content: [
                        "Only food and drinks purchased at Go Kids Play may be consumed on the premises.",
                        "During busy periods, food service may take up to 45 minutes.",
                        "Eating areas are kept separate from activity areas for health and safety reasons.",
                        "Food, drink, and chewing gum are not allowed on the skating rink or bowling lanes."
                    ]
                },
                {
                    title: "Health & Safety",
                    content: [
                        "Please ensure no food is discarded on the floor. Any spillages must be cleaned immediately—staff are available to help maintain hygiene.",
                        "Management must be informed of any toileting accidents or bodily fluids (urine, vomit, etc.) in the activity areas so that cleaning can be arranged.",
                        "Nappy changing facilities are provided and must only be used in designated areas. Soiled nappies must be disposed of in the bins provided.",
                        "Shoes must be worn in all toilet facilities."
                    ]
                },
                {
                    title: "Activity Rules",
                    content: [
                        "All activities and equipment are subject to availability. Management reserves the right to close an activity at any time without prior notice. Refunds will not be issued.",
                        "Our facilities are designed to meet strict safety and quality standards. However, Go Kids Play cannot be held responsible for accidents resulting from improper use or failure to follow rules.",
                        "Grip socks/appropriate footwear must be worn in skating areas. Skate hire is available at an additional cost.",
                        "Unwell participants should not skate or participate in physical activities.",
                        "Entry to activities may be refused if participants do not meet safety requirements or fail to follow rules and staff instructions.",
                        "Staff supervise the activity areas to help ensure safety, but they are not a replacement for parental or guardian supervision."
                    ]
                }
            ]
        },
        waiver: {
            title: "Participant Waiver",
            intro: "IMPORTANT: Please read this waiver carefully before signing. By signing this document, you acknowledge and agree to the terms below.",
            sections: [
                {
                    title: "1. ACKNOWLEDGEMENT OF RISKS",
                    content: ["I, the undersigned, understand that roller skating and related activities involve inherent risks, including but not limited to, falls, collisions, injuries or even death caused by the venue environment or other participants. I acknowledge that roller skating is a physically demanding activity and may result in serious injury, including fractures, sprains, head injuries, and other health complications. I also understand that any physical activity, including roller skating, carries risks of injury, even with the use of safety equipment."]
                },
                {
                    title: "2. ASSUMPTION OF RISK",
                    content: ["By participating in roller skating activities at Go Kids Play, I voluntarily assume all risks associated with these activities, whether known or unknown, foreseeable or unforeseeable, including injury to myself or others, and damage to property. I am fully responsible for my actions while participating and acknowledge that I am free to stop skating at any time if I feel unsafe or uncomfortable."]
                },
                {
                    title: "3. WAIVER AND RELEASE",
                    content: ["In consideration for being permitted to participate in roller skating and related activities at Go Kids Play, I, on behalf of myself, my heirs, executors, administrators, and assigns, hereby release, discharge, and agree to hold harmless Go Kids Play, its owners, employees, agents, contractors, volunteers, and affiliates from any and all claims, demands, causes of action, or liabilities for personal injury, death, or property damage arising out of my participation in roller skating activities, even if caused by negligence or the failure of Go Kids Play to properly supervise, maintain the premises, or provide adequate safety equipment."]
                },
                {
                    title: "4. HEALTH AND SAFETY",
                    content: [
                        "I affirm that I am physically capable of engaging in roller skating activities. I do not suffer from any medical condition that would make my participation unsafe or detrimental to my health. If I experience any medical condition, injury, or pain while participating in roller skating, I will immediately cease participating and inform venue staff.",
                        "I understand that the use of appropriate safety gear, including but not limited to wrist guards, knee pads, elbow pads, and helmets, is recommended but not required. It is my responsibility to use safety gear if I choose, and I acknowledge that failure to do so may increase my risk of injury."
                    ]
                },
                {
                    title: "5. COMPLIANCE WITH VENUE RULES AND INSTRUCTIONS",
                    content: ["I agree to follow all posted rules and regulations of Go Kids Play and to comply with any instructions given by the staff or personnel. I understand that failure to adhere to these rules or behave in an unsafe or disruptive manner may result in my removal from the venue without refund."]
                },
                {
                    title: "6. PHOTO AND VIDEO CONSENT",
                    content: ["I grant permission to Go Kids Play to take photos and/or video recordings of my participation in roller skating activities, which may be used for promotional, marketing, or other business purposes. I waive any right to compensation or royalties regarding such use."]
                },
                {
                    title: "7. MINORS",
                    content: [
                        "(If the participant is under the age of 16, this waiver must be signed by a parent or legal guardian, who agrees to accept full responsibility for the safety and well-being of the minor participant and assumes all risks outlined in this document)",
                        "Applicable if signing on behalf of minor only : I am the parent or legal guardian of the participant named in this form. I understand that roller skating involves inherent risks, and I accept full responsibility for the safety and well-being of the minor. I have read and understood the terms of this waiver and voluntarily agree to them on behalf of the minor participant."
                    ]
                },
                {
                    title: "8. SEVERABILITY",
                    content: ["If any part of this waiver is determined to be invalid, illegal, or unenforceable, the remainder of the waiver shall continue in full force and effect."]
                }
            ]
        }
    };

    return (
        <main className="min-h-screen bg-background text-white pt-24">
            {/* Header */}
            <section className="relative py-20 px-4 bg-gradient-to-b from-background-dark to-background">
                <div className="max-w-7xl mx-auto text-center">
                    <ScrollReveal animation="slideUp">
                        <h1 className="text-5xl md:text-7xl font-display font-black mb-6">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                Terms & Guidelines
                            </span>
                        </h1>
                        <p className="text-xl text-white/70 max-w-2xl mx-auto">
                            Please read our terms, rules, and waiver carefully to ensure a safe and enjoyable experience.
                        </p>
                    </ScrollReveal>
                </div>
                <SectionDivider position="bottom" variant="curve" color="fill-background" />
            </section>

            {/* Navigation Tabs */}
            <section className="sticky top-20 z-40 bg-background/95 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex overflow-x-auto gap-8 py-4 no-scrollbar justify-center">
                        {[
                            { id: "terms", label: "Terms & Conditions", icon: <FileText className="w-4 h-4" /> },
                            { id: "rules", label: "Rules & Guidelines", icon: <Shield className="w-4 h-4" /> },
                            { id: "waiver", label: "Participant Waiver", icon: <CheckCircle className="w-4 h-4" /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-primary text-black shadow-neon-blue"
                                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Terms Content */}
                    {activeTab === "terms" && (
                        <ScrollReveal animation="fade">
                            <div className="space-y-12">
                                {content.terms.sections.map((section, index) => (
                                    <div key={index} className="bg-surface-800/50 p-8 rounded-3xl border border-white/10">
                                        <h3 className="text-2xl font-display font-bold mb-6 text-primary flex items-center gap-3">
                                            {section.title}
                                        </h3>
                                        <ul className="space-y-4">
                                            {section.content.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 text-white/80">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </ScrollReveal>
                    )}

                    {/* Rules Content */}
                    {activeTab === "rules" && (
                        <ScrollReveal animation="fade">
                            <div className="space-y-12">
                                {content.rules.sections.map((section, index) => (
                                    <div key={index} className="bg-surface-800/50 p-8 rounded-3xl border border-white/10">
                                        <h3 className="text-2xl font-display font-bold mb-6 text-secondary flex items-center gap-3">
                                            {section.title}
                                        </h3>
                                        <ul className="space-y-4">
                                            {section.content.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 text-white/80">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </ScrollReveal>
                    )}

                    {/* Waiver Content */}
                    {activeTab === "waiver" && (
                        <ScrollReveal animation="fade">
                            <div className="bg-surface-800/50 p-8 rounded-3xl border border-white/10">
                                <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-xl">
                                    <p className="text-accent font-bold text-center">
                                        {content.waiver.intro}
                                    </p>
                                </div>
                                <div className="space-y-8">
                                    {content.waiver.sections.map((section, index) => (
                                        <div key={index}>
                                            <h3 className="text-lg font-bold mb-3 text-white">
                                                {section.title}
                                            </h3>
                                            <div className="space-y-3">
                                                {section.content.map((item, i) => (
                                                    <p key={i} className="text-white/70 text-sm leading-relaxed">
                                                        {item}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ScrollReveal>
                    )}
                </div>
            </section>
        </main>
    );
}
