"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollReveal, BouncyButton, SectionDivider, ImageCarousel } from "@repo/ui";
import { motion } from "framer-motion";
import { Check, PartyPopper, Mail, Utensils, Cake, Gift, Music, AlertCircle, CheckCircle, Eye } from "lucide-react";
import { getMediaUrl } from "@/lib/media-utils";
import { MenuPopup } from "@/components/MenuPopup";
import { TimingCardsClient } from "@/components/TimingCardsClient";

interface PartyContentProps {
    packages: any[];
    menus: any[];
    hero?: {
        title: string;
        subtitle: string;
        image: string;
    };
    settings?: any;
    terms?: string; // HTML string or plain text
    carouselImages?: string[];
}

export const metadata = getMetadata(
    "Birthday Party Coventry",
    "Book an unforgettable kids birthday party at Go Kids Play Coventry. Our £250 party package includes entry for 10 kids, 75 mins play (Soft Play, Laser Arena & Go Karts), party room, food, and online invitations."
);

export default function PartyContent({ packages, menus, hero, settings, terms, carouselImages }: PartyContentProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // ... [Rest of code]
    // ...

    const heroTitle = hero?.title || "Go Kids Play Party Booking";
    const heroSubtitle = hero?.subtitle || "Celebrate with the ultimate adventure! Birthdays, school trips, corporate events - we've got you covered.";
    const heroImage = getMediaUrl(hero?.image) || "/images/uploads/img-3.jpg";
    const phone = settings?.contact_phone || "07349110865";
    const email = settings?.contact_email || "info@gokidsplay.co.uk";

    return (
        <main className="bg-background text-white min-h-screen pt-24">
            <MenuPopup isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} menuSections={menus} />
            {/* Header - Reduced padding */}
            <section className="relative py-16 px-4 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={heroImage}
                        alt="Party Booking"
                        className="w-full h-full object-cover opacity-30"
                        onError={(e) => {
                            e.currentTarget.src = "/hero-background.jpg";
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
                </div>
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <ScrollReveal animation="slideUp">
                        <span className="inline-block py-1 px-4 rounded-full bg-primary text-black font-black text-xs mb-4 tracking-widest uppercase">
                            🎉 Parties & Events
                        </span>
                        <h1 className="text-3xl md:text-4xl lg:text-6xl font-display font-black mb-3">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                {heroTitle}
                            </span>
                        </h1>
                        <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-2">
                            {heroSubtitle}
                        </p>
                        <p className="text-sm text-secondary font-bold">
                            Available: {settings?.party_availability || "Wednesday - Sunday"}
                        </p>
                    </ScrollReveal>
                </div>
            </section>

            {/* Timing Cards — below hero */}
            <TimingCardsClient />



            {/* Official Party Package */}
            <section className="relative px-4 py-12 bg-background">
                <div className="max-w-4xl mx-auto">
                    <ScrollReveal animation="slideUp">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-display font-black mb-4">
                                Our £250 Party Package
                            </h2>
                            <p className="text-lg text-white/70 max-w-2xl mx-auto">
                                Looking for a fun way to celebrate? Our £250 Party Package is the perfect choice for an unforgettable experience.
                                This package includes everything you need for a great time: 75 minutes of play across our main attractions, a dedicated party area, food, and much more!
                            </p>
                        </div>
                    </ScrollReveal>

                    {/* Single Official GKP Party Package */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ScrollReveal animation="slideUp" delay={0.1}>
                            <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border-2 border-primary h-full flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-2xl font-display font-bold flex items-center gap-2 text-primary">
                                        <PartyPopper className="w-6 h-6" />
                                        Go Kids Play Party
                                    </h3>
                                    <span className="text-3xl font-black text-white">£250</span>
                                </div>
                                <p className="text-white/60 text-sm mb-4">The complete party experience — everything included for 10 kids.</p>
                                <ul className="space-y-3 text-white/80 flex-1">
                                    {[
                                        "Entry for 10 Kids (additional child £20 each)",
                                        "Free entry for 10 adults (additional adult £4.95 each)",
                                        "75 Minutes of Play — Soft Play, Laser Arena & Go Karts",
                                        "45 Minutes use of private Party Room",
                                        "Party Food for Kids (see menu →)",
                                        "Squash drinks & Mini Slush for children",
                                        "Online Party Invitation",
                                        "Inflatable Park add-on available (+£5 per person)",
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-5 pt-4 border-t border-white/10">
                                    <Link href="/party-booking">
                                        <BouncyButton size="sm" variant="primary" className="w-full">
                                            <PartyPopper className="w-4 h-4 mr-2" /> Book This Party
                                        </BouncyButton>
                                    </Link>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Party Feast */}
                        <ScrollReveal animation="slideUp" delay={0.2}>
                            <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border-2 border-secondary h-full flex flex-col">
                                <h3 className="text-2xl font-display font-bold mb-2 flex items-center gap-2 text-secondary">
                                    <Utensils className="w-6 h-6" />
                                    Party Feast Menu
                                </h3>
                                <p className="text-white/50 text-xs mb-4 font-semibold uppercase tracking-wider">Kids only · 1 portion each per item</p>
                                <div className="grid grid-cols-2 gap-2 flex-1">
                                    {[
                                        "🥪 Chocolate & Jam Sandwiches",
                                        "🍕 Pizza",
                                        "🍗 Chicken Chunks",
                                        "🥔 Potato Puffs",
                                        "🧅 Onion Rings",
                                        "🧄 Garlic Bread",
                                        "🍟 Curly Fries",
                                        "🍟 Chips",
                                        "🧃 Unlimited Squash",
                                        "🧊 Slush",
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10 text-sm font-bold text-accent text-center">
                                    ✅ Vegetarian & Halal options available
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(true)}
                                    className="mt-3 w-full py-2.5 bg-secondary/10 hover:bg-secondary/20 border border-secondary/40 text-secondary font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Eye className="w-4 h-4" /> View Full Café Menu
                                </button>
                            </div>
                        </ScrollReveal>
                    </div>

                    <div className="mt-10 flex justify-center">
                        <Link href="/party-booking" className="w-full md:w-auto">
                            <BouncyButton size="lg" variant="primary" className="w-full">
                                <PartyPopper className="w-5 h-5 mr-2" />
                                Book Your Party
                            </BouncyButton>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features - Compact */}
            <section className="relative px-4 py-12 bg-background">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: <Cake className="w-6 h-6 text-primary" />, title: "Private Party Room", desc: "Exclusive space for celebration" },
                            { icon: <Gift className="w-6 h-6 text-secondary" />, title: "Complete Package", desc: "Everything included" },
                            { icon: <Music className="w-6 h-6 text-accent" />, title: "All Activities", desc: "Full park access" },
                        ].map((feature, index) => (
                            <ScrollReveal key={index} animation="fade" delay={index * 0.1}>
                                <div className="bg-surface-800/50 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-center">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-display font-bold mb-1">{feature.title}</h3>
                                    <p className="text-white/60 text-sm">{feature.desc}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Terms - Dynamic or Static Fallback */}
            <section className="relative px-4 py-12 bg-background-light">
                <div className="max-w-5xl mx-auto">
                    <ScrollReveal animation="slideUp">
                        <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                            <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2 justify-center">
                                <AlertCircle className="w-6 h-6 text-secondary" />
                                Party T&C
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                {terms ? (
                                    <div className="col-span-2 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: terms }} />
                                ) : (
                                    [
                                        "50% non-refundable deposit confirms your booking",
                                        "Minimum 10 participants required (under 14s)",
                                        "Full balance (including extras) due before party starts",
                                        "Free rescheduling with 14+ days notice (1 change only)",
                                        "Rescheduling under 14 days: £50 admin fee applies",
                                        "No rescheduling or refund within 48 hours of party time",
                                        "Cancellations must be confirmed by email",
                                        "Party lasts approx 2 hours: 75 mins play + 45 mins party room",
                                        "Additional adults/children charged at entry",
                                        "Inflatable Park not included (£5 per person add-on)",
                                        "Allergy/dietary info must be provided at least 2 days prior",
                                        "No sparkler candles, flower pot candles, poppers or confetti",
                                        "Please arrive 15 minutes before your party start time",
                                        "Extra time in party room: £5 per 15 minutes",
                                        "Car park: max 3 hours. We accept no liability for parking charges",
                                    ].map((term, index) => (
                                        <div key={index} className="flex gap-2 items-start text-white/80">
                                            <CheckCircle className="w-3 h-3 text-secondary shrink-0 mt-0.5" />
                                            <span>{term}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10 text-center text-xs text-white/60">
                                <p>
                                    Email:{" "}
                                    <a href={`mailto:${email}`} className="text-primary hover:underline">
                                        {email}
                                    </a>
                                </p>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
                <SectionDivider position="bottom" variant="wave" color="fill-background" />
            </section>

            {/* CTA - Compact */}
            <section className="relative py-16 px-4 pb-32 md:pb-40 bg-background">
                <div className="max-w-3xl mx-auto text-center">
                    <ScrollReveal animation="scale">
                        <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
                            Ready to Party?
                        </h2>
                        <p className="text-lg text-white/70 mb-6">
                            Book now and make it unforgettable!
                        </p>
                        <div className="flex justify-center">
                            <Link href="/party-booking">
                                <BouncyButton size="lg" variant="accent">
                                    <PartyPopper className="w-5 h-5 mr-2" />
                                    Book Your Party
                                </BouncyButton>
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </main>
    );
}
