"use client";

import { AttractionsGrid } from "@/features/attractions/components/AttractionsGrid";
import { ScrollReveal, SectionDivider } from "@repo/ui";
import { Coffee, Car, Shield, Wifi, Utensils, Users, Zap, Sparkles, Star, Clock } from "lucide-react";
import { getMediaUrl } from "@/lib/media-utils";
import AttractionVideoSection from "@/components/AttractionVideoSection";
import { TimingCardsClient } from "@/components/TimingCardsClient";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { listItems } from "@/lib/cms/page-registry";

interface AttractionsContentProps {
    activities: any[];
    facilities: any[];
    videoData?: any;
    /** Resolved "attractions" page content — see lib/cms/page-registry.ts. Hidden sections are null. */
    content: Record<string, Record<string, string> | null>;
}

// Colour themes cycled across the "everything under one roof" cards
const HIGHLIGHT_THEMES = [
    { color: "border-yellow-500/40 bg-yellow-500/5", accent: "text-yellow-400" },
    { color: "border-red-500/40 bg-red-500/5", accent: "text-red-400" },
    { color: "border-blue-500/40 bg-blue-500/5", accent: "text-blue-400" },
    { color: "border-purple-500/40 bg-purple-500/5", accent: "text-purple-400" },
];

// Activity-specific info to enrich cards if CMS data is sparse
const ACTIVITY_HIGHLIGHTS: Record<string, { emoji: string; color: string; tagline: string }> = {
    "soft play": { emoji: "🧨", color: "from-yellow-400 to-orange-500", tagline: "3-Tier Soft Play Frame" },
    "laser arena": { emoji: "🔫", color: "from-red-500 to-pink-600", tagline: "Multi-Level Laser Tag" },
    "go kart": { emoji: "🏎️", color: "from-blue-500 to-indigo-600", tagline: "Indoor Go Kart Racing" },
    "inflatable park": { emoji: "👁️", color: "from-purple-500 to-violet-600", tagline: "Massive Bounce Area" },
};

function getActivityMeta(name: string) {
    const key = name?.toLowerCase() || "";
    for (const [k, v] of Object.entries(ACTIVITY_HIGHLIGHTS)) {
        if (key.includes(k.split(" ")[0])) return v;
    }
    return { emoji: "⭐", color: "from-primary to-secondary", tagline: "Fun for Everyone" };
}

export default function AttractionsContent({ activities, facilities, videoData, content }: AttractionsContentProps) {
    const { hero, highlights, facilities: facilitiesText, cta } = content;

    const getIcon = (iconName: string) => {
        const lower = iconName?.toLowerCase() || "";
        if (lower.includes("user")) return <Users className="w-8 h-8 text-primary" />;
        if (lower.includes("coffee") || lower.includes("cafe")) return <Coffee className="w-8 h-8 text-secondary" />;
        if (lower.includes("party") || lower.includes("utensil")) return <Utensils className="w-8 h-8 text-accent" />;
        if (lower.includes("car") || lower.includes("parking")) return <Car className="w-8 h-8 text-primary" />;
        if (lower.includes("shield") || lower.includes("safety")) return <Shield className="w-8 h-8 text-secondary" />;
        if (lower.includes("wifi") || lower.includes("amenit")) return <Wifi className="w-8 h-8 text-accent" />;
        return <Zap className="w-8 h-8 text-primary" />;
    };

    // "Everything under one roof" cards — each CMS line is "emoji | title | description"
    const whyGoKidsPlay = listItems(highlights?.cards).map((line, i) => {
        const [emoji = "", title = "", desc = ""] = line.split("|").map((part) => part.trim());
        return { emoji, title, desc, ...HIGHLIGHT_THEMES[i % HIGHLIGHT_THEMES.length] };
    });

    return (
        <main className="min-h-screen bg-background text-white">
            {/* ── Hero ──────────────────────────────────── */}
            {hero && (
            <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 bg-gradient-to-b from-background-dark to-background overflow-hidden">
                {/* subtle background glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
                </div>
                <div className="max-w-7xl mx-auto text-center relative">
                    <ScrollReveal animation="fade">
                        <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold text-sm mb-6 tracking-wider uppercase">
                            <Sparkles className="w-4 h-4" /> {hero.badge || (activities.length > 0 ? `${activities.length} Activities` : "Soft Play · Laser Arena · Go Karts · Inflatables")}
                        </span>
                    </ScrollReveal>
                    <ScrollReveal animation="slideUp" delay={0.2}>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-display font-black mb-6 leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                {hero.title}
                            </span>
                        </h1>
                        <p className="text-base md:text-xl lg:text-2xl text-white/70 max-w-3xl mx-auto">
                            {hero.subtitle}
                        </p>
                    </ScrollReveal>

                    {/* Quick CTA */}
                    <ScrollReveal animation="slideUp" delay={0.4}>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                            <Link
                                href={hero.button1_link || "/book"}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-lg rounded-full shadow-lg shadow-pink-500/40 hover:scale-105 transition-all"
                            >
                                {hero.button1_text}
                            </Link>
                            <Link
                                href={hero.button2_link || "/pricing"}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-bold text-lg rounded-full hover:bg-white/10 transition-all"
                            >
                                {hero.button2_text}
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
                <SectionDivider position="bottom" variant="curve" color="fill-background" />
            </section>
            )}

            {/* Timing Cards — below hero */}
            <TimingCardsClient />

            {/* ── Why Go Kids Play ───────────────────────────── */}
            {highlights && whyGoKidsPlay.length > 0 && (
            <section className="py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal animation="fade">
                        <p className="text-center text-white/50 uppercase tracking-widest text-xs font-bold mb-8">{highlights.title}</p>
                    </ScrollReveal>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {whyGoKidsPlay.map((item, i) => (
                            <ScrollReveal key={`${item.title}-${i}`} animation="slideUp" delay={i * 0.1}>
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    className={`rounded-2xl border-2 p-6 ${item.color} transition-all`}
                                >
                                    <div className="text-4xl mb-4">{item.emoji}</div>
                                    <h3 className={`text-xl font-black mb-2 ${item.accent}`}>{item.title}</h3>
                                    <p className="text-white/60 text-sm">{item.desc}</p>
                                </motion.div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>
            )}

            {/* ── Attraction Video ──────────────────────── */}
            <AttractionVideoSection videoData={videoData} />

            {/* ── Attractions Grid ──────────────────────── */}
            <AttractionsGrid activities={activities} />

            {/* ── Park Facilities ──────────────────────── */}
            {facilitiesText && facilities.length > 0 && (
                <section className="relative py-12 md:py-20 px-4 pb-32 md:pb-40 bg-background-light">
                    <div className="max-w-7xl mx-auto">
                        <ScrollReveal animation="slideUp">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl md:text-5xl lg:text-7xl font-display font-black mb-6">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                        {facilitiesText.title}
                                    </span>
                                </h2>
                                <p className="text-base md:text-xl text-white/70 max-w-2xl mx-auto">
                                    {facilitiesText.subtitle}
                                </p>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {facilities.map((facility, index) => (
                                <ScrollReveal key={facility.id || index} animation="fade" delay={index * 0.1}>
                                    <div className="bg-surface-800 rounded-3xl border border-white/10 hover:border-primary/30 transition-colors flex flex-col overflow-hidden group h-full">
                                        <div className="h-48 overflow-hidden relative flex-shrink-0">
                                            <Image
                                                src={getMediaUrl(facility.image_url) || `/images/hero-background.jpg`}
                                                alt={facility.title || facility.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => {
                                                    e.currentTarget.srcset = "";
                                                    e.currentTarget.src = "/images/hero-background.jpg";
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-surface-800 to-transparent opacity-60" />
                                            <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-md p-2 rounded-xl">
                                                {getIcon(facility.icon || facility.icon_name || facility.name)}
                                            </div>
                                        </div>
                                        <div className="p-6 flex-grow flex flex-col">
                                            <h3 className="text-2xl font-display font-bold mb-3 text-white">
                                                {facility.title || facility.name}
                                            </h3>
                                            <p className="text-white/70 mb-6 line-clamp-3">
                                                {facility.description}
                                            </p>
                                            <ul className="space-y-2 mt-auto">
                                                {Array.isArray(facility.items) ? facility.items.slice(0, 4).map((item: string, i: number) => (
                                                    <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                                        {typeof item === 'string' ? item : (item as any).value || (item as any).name || ""}
                                                    </li>
                                                )) : (
                                                    (facility.items || facility.features || "").toString().split(',').filter((x: string) => x.trim()).slice(0, 4).map((item: string, i: number) => (
                                                        <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                                            {item.trim()}
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                    <SectionDivider position="bottom" variant="wave" color="fill-background" />
                </section>
            )}

            {/* ── Final CTA ────────────────────────────── */}
            {cta && (
            <section className="py-20 px-4 text-center bg-background">
                <ScrollReveal animation="slideUp">
                    <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-4">
                        {cta.title}
                    </h2>
                    <p className="text-white/60 mb-8 text-lg max-w-xl mx-auto">
                        {cta.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={cta.button_link || "/book"}
                            className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white font-black text-xl rounded-full shadow-lg shadow-pink-500/40 hover:scale-105 transition-all"
                        >
                            {cta.button_text}
                        </Link>
                    </div>
                    {cta.note && (
                        <p className="mt-6 text-white/40 text-sm flex items-center justify-center gap-1">
                            <Clock className="w-4 h-4" /> {cta.note}
                        </p>
                    )}
                </ScrollReveal>
            </section>
            )}
        </main>
    );
}
