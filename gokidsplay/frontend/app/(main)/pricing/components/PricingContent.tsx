"use client";

import Link from "next/link";
import { ScrollReveal, BouncyButton, SectionDivider } from "@repo/ui";
import { motion } from "framer-motion";
import { Check, Clock, AlertCircle } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/format-utils";
import { getMediaUrl } from "@/lib/media-utils";
import PricingCarousel from "./PricingCarousel";
import { TimingCardsClient } from "@/components/TimingCardsClient";

interface PricingContentProps {
    plans: any[];
    settings?: any;
    info?: any;
    hero?: {
        title: string;
        subtitle: string;
        image: string;
    };
    carouselImages?: any[];
}

// Helper to find a plan by name (case-insensitive partial match)
function findPlan(plans: any[], ...names: string[]) {
    for (const name of names) {
        const found = plans.find(p => p.name?.toLowerCase().includes(name.toLowerCase()));
        if (found) return found;
    }
    return null;
}

function formatPrice(price: any) {
    if (price === undefined || price === null) return null;
    const num = parseFloat(price);
    return isNaN(num) ? null : num.toFixed(2);
}

export default function PricingContent({ plans, settings, info, hero, carouselImages = [] }: PricingContentProps) {
    // Ensure active plans only
    const activePlans = plans.filter(p => !p.hasOwnProperty('active') || p.active);

    // Dynamically resolve prices from CMS — GoKidsPlay Coventry pricing
    const babyPlan         = findPlan(activePlans, 'under 12 months', 'baby');
    const toddlerPlan      = findPlan(activePlans, 'under 24 months', 'toddler');
    const childPlan        = findPlan(activePlans, '24 months', 'child', 'standard');
    const spectatorPlan    = findPlan(activePlans, 'non playing', 'spectator');

    const babyPrice        = formatPrice(babyPlan?.price)       ?? '1.95';
    const toddlerPrice     = formatPrice(toddlerPlan?.price)    ?? '7.95';
    const childPrice       = formatPrice(childPlan?.price)      ?? '12.95';
    const spectatorPrice   = formatPrice(spectatorPlan?.price)  ?? '4.95';

    const heroTitle = hero?.title || "Our Prices";
    const heroSubtitle = hero?.subtitle || "Play session is for 2 hours only. Open School Holidays & Weekends.";

    return (
        <main className="bg-background text-white min-h-screen">
            {/* Hero */}
            <section className="relative pt-32 pb-20 px-4 bg-gradient-to-b from-background-dark to-background">
                <div className="max-w-7xl mx-auto text-center">
                    <ScrollReveal animation="fade">
                        <span className="inline-block py-1 px-3 rounded-full bg-primary text-black font-bold text-sm mb-6 tracking-wider uppercase">
                            Pricing
                        </span>
                    </ScrollReveal>
                    <ScrollReveal animation="slideUp" delay={0.2}>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-black mb-6 leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                {heroTitle}
                            </span>
                        </h1>
                        {hero?.image && (
                            <div className="relative w-full max-w-4xl mx-auto h-64 md:h-96 rounded-3xl overflow-hidden mb-8 shadow-2xl border border-white/10">
                                <Image
                                    src={getMediaUrl(hero.image)}
                                    alt={heroTitle}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                            </div>
                        )}
                        <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto">
                            {heroSubtitle}
                        </p>
                    </ScrollReveal>
                </div>

                {/* Carousel Section */}
                {carouselImages && carouselImages.length > 0 && (
                    <div className="mt-12">
                        <PricingCarousel images={carouselImages} />
                    </div>
                )}

                <SectionDivider position="bottom" variant="curve" color="fill-background" />
            </section>

            {/* Timing Cards — below hero */}
            <TimingCardsClient />

            {/* Pricing Cards */}
            <section className="relative px-4 pb-32 md:pb-40 pt-16">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                Our Pricing
                            </span>
                        </h2>
                        <p className="text-white/70 text-lg">Simple, transparent pricing for all our activities</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {/* 24 months & above — Most Popular */}
                        <ScrollReveal animation="scale" delay={0}>
                            <motion.div
                                whileHover={{ y: -10 }}
                                className="relative p-5 md:p-8 rounded-3xl border-2 border-primary bg-surface-800/80 backdrop-blur-sm h-full flex flex-col"
                            >
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black font-bold py-1 px-4 rounded-full text-sm">
                                    MOST POPULAR
                                </div>
                                <h3 className="text-2xl font-display font-bold mb-2 text-primary">
                                    Child (24 months & above)
                                </h3>
                                <p className="text-white/60 mb-6">Full Park Access</p>
                                <div className="mb-8">
                                    <span className="text-5xl font-black text-white">£{childPrice}</span>
                                    <span className="text-white/60 text-sm">/ 2 Hours</span>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-primary shrink-0" />
                                        <span className="text-sm">Mega Soft Play</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-primary shrink-0" />
                                        <span className="text-sm">Laser Arena</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-primary shrink-0" />
                                        <span className="text-sm">Go Karts</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-primary shrink-0" />
                                        <span className="text-sm">Inflatable Park</span>
                                    </li>
                                </ul>
                                <Link href="/book" className="w-full">
                                    <div className="w-full">
                                        <BouncyButton size="lg" variant="primary" className="w-full">
                                            Book Now
                                        </BouncyButton>
                                    </div>
                                </Link>
                            </motion.div>
                        </ScrollReveal>

                        {/* Under 24 Months */}
                        <ScrollReveal animation="scale" delay={0.1}>
                            <motion.div
                                whileHover={{ y: -10 }}
                                className="relative p-5 md:p-8 rounded-3xl border-2 border-white/10 bg-surface-800/50 backdrop-blur-sm h-full flex flex-col"
                            >
                                <h3 className="text-2xl font-display font-bold mb-2 text-secondary">
                                    Toddler (Under 24 months)
                                </h3>
                                <p className="text-white/60 mb-6">Toddler Play Area</p>
                                <div className="mb-8">
                                    <span className="text-5xl font-black text-white">£{toddlerPrice}</span>
                                    <span className="text-white/60 text-sm">/ 2 Hours</span>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-secondary shrink-0" />
                                        <span className="text-sm">Dedicated Toddler Zone</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-secondary shrink-0" />
                                        <span className="text-sm">Safe & Supervised</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-secondary shrink-0" />
                                        <span className="text-sm">Soft Play Access</span>
                                    </li>
                                </ul>
                                <Link href="/book" className="w-full">
                                    <div className="w-full">
                                        <BouncyButton size="lg" variant="secondary" className="w-full">
                                            Book Now
                                        </BouncyButton>
                                    </div>
                                </Link>
                            </motion.div>
                        </ScrollReveal>

                        {/* Under 12 Months */}
                        <ScrollReveal animation="scale" delay={0.2}>
                            <motion.div
                                whileHover={{ y: -10 }}
                                className="relative p-5 md:p-8 rounded-3xl border-2 border-white/10 bg-surface-800/50 backdrop-blur-sm h-full flex flex-col"
                            >
                                <h3 className="text-2xl font-display font-bold mb-2 text-accent">
                                    Baby (Under 12 months)
                                </h3>
                                <p className="text-white/60 mb-6">Baby Area</p>
                                <div className="mb-8">
                                    <span className="text-5xl font-black text-white">£{babyPrice}</span>
                                    <span className="text-white/60 text-sm">/ 2 Hours</span>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-accent shrink-0" />
                                        <span className="text-sm">Sensory play</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-accent shrink-0" />
                                        <span className="text-sm">Baby change facilities</span>
                                    </li>
                                </ul>
                                <Link href="/book" className="w-full">
                                    <div className="w-full">
                                        <BouncyButton size="lg" variant="accent" className="w-full">
                                            Book Now
                                        </BouncyButton>
                                    </div>
                                </Link>
                            </motion.div>
                        </ScrollReveal>

                        {/* Spectators */}
                        <ScrollReveal animation="scale" delay={0.3}>
                            <motion.div
                                whileHover={{ y: -10 }}
                                className="relative p-5 md:p-8 rounded-3xl border-2 border-white/10 bg-surface-800/50 backdrop-blur-sm h-full flex flex-col"
                            >
                                <h3 className="text-2xl font-display font-bold mb-2 text-white">
                                    Non-playing Adult
                                </h3>
                                <p className="text-white/60 mb-6">Supervising</p>
                                <div className="mb-8">
                                    <span className="text-5xl font-black text-white">£{spectatorPrice}</span>
                                    <span className="text-white/60 text-sm">/ 2 Hours</span>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-white/60 shrink-0" />
                                        <span className="text-sm">Supervision access</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-white/60 shrink-0" />
                                        <span className="text-sm">Cafe seating</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-white/80">
                                        <Check className="w-5 h-5 text-white/60 shrink-0" />
                                        <span className="text-sm">Free Wi-Fi</span>
                                    </li>
                                </ul>
                                <Link href="/book" className="w-full">
                                    <div className="w-full">
                                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">
                                            Book Now
                                        </button>
                                    </div>
                                </Link>
                            </motion.div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* Additional Info */}
            <section className="relative py-12 md:py-20 px-4 bg-background-light">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ScrollReveal animation="slideRight">
                            <div className="bg-surface-800 p-8 rounded-3xl border border-white/10">
                                <h3 className="text-2xl font-display font-bold mb-4 flex items-center gap-3">
                                    <Clock className="w-6 h-6 text-primary" />
                                    Opening Hours
                                </h3>
                                <ul className="space-y-3 text-white/80">
                                    <li className="flex justify-between">
                                        <span>Mon / Tue</span>
                                        <span className="font-bold text-red-400">Closed</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Wed – Sun</span>
                                        <span className="font-bold text-white">10:00am – 5:30pm</span>
                                    </li>
                                    <li className="text-sm text-white/60 mt-2">
                                        ⚠ Except Bank &amp; School Holidays (open Mon/Tue)
                                    </li>
                                    <li className="text-sm text-primary font-bold mt-1">
                                        Open SCHOOL HOLIDAYS &amp; WEEKENDS only
                                    </li>
                                </ul>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal animation="slideLeft">
                            <div className="bg-surface-800 p-8 rounded-3xl border border-white/10">
                                <h3 className="text-2xl font-display font-bold mb-4 flex items-center gap-3">
                                    <AlertCircle className="w-6 h-6 text-secondary" />
                                    Pricing Details
                                </h3>
                                <ul className="space-y-3 text-white/80 text-sm">
                                    <li>• <strong>Under 12 months:</strong> £{babyPrice}</li>
                                    <li>• <strong>Under 24 months:</strong> £{toddlerPrice}</li>
                                    <li>• <strong>24 months &amp; above:</strong> £{childPrice}</li>
                                    <li>• <strong>Non playing adult:</strong> £{spectatorPrice}</li>
                                    <li className="text-yellow-400 font-bold pt-2">💵 CASH ONLY on the day</li>
                                    <li className="text-white/60">Free Cash Machine available on site</li>
                                    <li className="text-green-400">✓ Book online to pay by card</li>
                                </ul>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
                <SectionDivider position="bottom" variant="wave" color="fill-background" />
            </section>
        </main>
    );
}
