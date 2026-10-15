"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollReveal, BouncyButton, SectionDivider, ImageCarousel } from "@repo/ui";
import { motion } from "framer-motion";
import { Check, PartyPopper, Mail, Utensils, Cake, Gift, Music, AlertCircle, CheckCircle, Eye } from "lucide-react";
import { getMediaUrl } from "@/lib/media-utils";
import { MenuPopup } from "@/components/MenuPopup";
import { TimingCardsClient } from "@/components/TimingCardsClient";
import { listItems } from "@/lib/cms/page-registry";

interface PartyContentProps {
    menus: any[];
    settings?: any;
    /** Resolved "party-booking" page content — see lib/cms/page-registry.ts. Hidden sections are null. */
    content: Record<string, Record<string, string> | null>;
}

const FEATURE_ICONS = [
    <Cake key="cake" className="w-6 h-6 text-primary" />,
    <Gift key="gift" className="w-6 h-6 text-secondary" />,
    <Music key="music" className="w-6 h-6 text-accent" />,
];

export default function PartyContent({ menus, settings, content }: PartyContentProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { hero, package: pkg, feast, features, terms, cta } = content;

    const heroImage = getMediaUrl(hero?.image) || "/images/uploads/img-3.jpg";
    const email = terms?.email || settings?.contactEmail || "info@gokidsplay.co.uk";
    const bookingLink = pkg?.button_link || "/party-booking";
    const featureCards = listItems(features?.cards).map((line) => {
        const [title = "", desc = ""] = line.split("|").map((part) => part.trim());
        return { title, desc };
    });

    return (
        <main className="bg-background text-white min-h-screen pt-24">
            <MenuPopup isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} menuSections={menus} />
            {/* Header - Reduced padding */}
            {hero && (
            <section className="relative py-16 px-4 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={heroImage}
                        alt="Party Booking"
                        className="w-full h-full object-cover opacity-30"
                        onError={(e) => {
                            e.currentTarget.src = "/images/hero-background.jpg";
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
                </div>
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <ScrollReveal animation="slideUp">
                        <span className="inline-block py-1 px-4 rounded-full bg-primary text-black font-black text-xs mb-4 tracking-widest uppercase">
                            {hero.badge}
                        </span>
                        <h1 className="text-3xl md:text-4xl lg:text-6xl font-display font-black mb-3">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                {hero.title}
                            </span>
                        </h1>
                        <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-2">
                            {hero.subtitle}
                        </p>
                        {hero.availability && (
                            <p className="text-sm text-secondary font-bold">{hero.availability}</p>
                        )}
                    </ScrollReveal>
                </div>
            </section>
            )}

            {/* Timing Cards — below hero */}
            <TimingCardsClient />



            {/* Official Party Package */}
            {(pkg || feast) && (
            <section className="relative px-4 py-12 bg-background">
                <div className="max-w-4xl mx-auto">
                    {pkg && (
                    <ScrollReveal animation="slideUp">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-display font-black mb-4">
                                {pkg.title}
                            </h2>
                            <p className="text-lg text-white/70 max-w-2xl mx-auto">
                                {pkg.subtitle}
                            </p>
                        </div>
                    </ScrollReveal>
                    )}

                    {/* Single Official GKP Party Package */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {pkg && (
                        <ScrollReveal animation="slideUp" delay={0.1}>
                            <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border-2 border-primary h-full flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-2xl font-display font-bold flex items-center gap-2 text-primary">
                                        <PartyPopper className="w-6 h-6" />
                                        {pkg.card_title}
                                    </h3>
                                    <span className="text-3xl font-black text-white">{pkg.price}</span>
                                </div>
                                <p className="text-white/60 text-sm mb-4">{pkg.card_subtitle}</p>
                                <ul className="space-y-3 text-white/80 flex-1">
                                    {listItems(pkg.includes).map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-5 pt-4 border-t border-white/10">
                                    <Link href={bookingLink}>
                                        <BouncyButton size="sm" variant="primary" className="w-full">
                                            <PartyPopper className="w-4 h-4 mr-2" /> {pkg.card_button_text}
                                        </BouncyButton>
                                    </Link>
                                </div>
                            </div>
                        </ScrollReveal>
                        )}

                        {/* Party Feast */}
                        {feast && (
                        <ScrollReveal animation="slideUp" delay={0.2}>
                            <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border-2 border-secondary h-full flex flex-col">
                                <h3 className="text-2xl font-display font-bold mb-2 flex items-center gap-2 text-secondary">
                                    <Utensils className="w-6 h-6" />
                                    {feast.title}
                                </h3>
                                <p className="text-white/50 text-xs mb-4 font-semibold uppercase tracking-wider">{feast.note}</p>
                                <div className="grid grid-cols-2 gap-2 flex-1">
                                    {listItems(feast.items).map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10 text-sm font-bold text-accent text-center">
                                    {feast.dietary}
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(true)}
                                    className="mt-3 w-full py-2.5 bg-secondary/10 hover:bg-secondary/20 border border-secondary/40 text-secondary font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Eye className="w-4 h-4" /> {feast.menu_button}
                                </button>
                            </div>
                        </ScrollReveal>
                        )}
                    </div>

                    {pkg && (
                    <div className="mt-10 flex justify-center">
                        <Link href={bookingLink} className="w-full md:w-auto">
                            <BouncyButton size="lg" variant="primary" className="w-full">
                                <PartyPopper className="w-5 h-5 mr-2" />
                                {pkg.main_button_text}
                            </BouncyButton>
                        </Link>
                    </div>
                    )}
                </div>
            </section>
            )}

            {/* Features - Compact */}
            {features && featureCards.length > 0 && (
            <section className="relative px-4 py-12 bg-background">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {featureCards.map((feature, index) => (
                            <ScrollReveal key={index} animation="fade" delay={index * 0.1}>
                                <div className="bg-surface-800/50 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-center">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                                        {FEATURE_ICONS[index % FEATURE_ICONS.length]}
                                    </div>
                                    <h3 className="text-lg font-display font-bold mb-1">{feature.title}</h3>
                                    <p className="text-white/60 text-sm">{feature.desc}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>
            )}

            {/* Terms */}
            {terms && (
            <section className="relative px-4 py-12 bg-background-light">
                <div className="max-w-5xl mx-auto">
                    <ScrollReveal animation="slideUp">
                        <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                            <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2 justify-center">
                                <AlertCircle className="w-6 h-6 text-secondary" />
                                {terms.title}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                {listItems(terms.items).map((term, index) => (
                                    <div key={index} className="flex gap-2 items-start text-white/80">
                                        <CheckCircle className="w-3 h-3 text-secondary shrink-0 mt-0.5" />
                                        <span>{term}</span>
                                    </div>
                                ))}
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
            )}

            {/* CTA - Compact */}
            {cta && (
            <section className="relative py-16 px-4 pb-32 md:pb-40 bg-background">
                <div className="max-w-3xl mx-auto text-center">
                    <ScrollReveal animation="scale">
                        <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
                            {cta.title}
                        </h2>
                        <p className="text-lg text-white/70 mb-6">
                            {cta.subtitle}
                        </p>
                        <div className="flex justify-center">
                            <Link href={cta.button_link || "/party-booking"}>
                                <BouncyButton size="lg" variant="accent">
                                    <PartyPopper className="w-5 h-5 mr-2" />
                                    {cta.button_text}
                                </BouncyButton>
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
            )}
        </main>
    );
}
