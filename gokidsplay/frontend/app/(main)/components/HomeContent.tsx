"use client";

import { AnimatedHero } from "../../../components/AnimatedHero";
import { ScrollReveal } from "../../../components/ScrollReveal";
import { BouncyButton } from "../../../components/BouncyButton";
import { SectionDivider } from "../../../components/SectionDivider";
import { Marquee } from "../../../components/Marquee";
import { TimingCardsClient } from "../../../components/TimingCardsClient";
import { motion } from "framer-motion";
import { Zap, Shield, Users, Trophy, ArrowRight, CalendarHeart, Star, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Stat, GalleryItem, Activity } from "../../../lib/api/types";
import dynamic from "next/dynamic";
import { getMediaUrl } from "@/lib/media-utils";
import { InstallAppSection } from "../../../components/InstallAppSection";
import { listItems } from "@/lib/cms/page-registry";

const InstagramReels = dynamic(() => import("./InstagramReels"), { 
    ssr: false, 
    loading: () => <div className="h-[600px] flex items-center justify-center text-white/50">Loading Instagram...</div>
});

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Zap,
    Users,
    Trophy,
    Shield,
};

interface HomeContentProps {
    stats: Stat[];
    gallery: GalleryItem[];
    banners: any[];
    reels?: any[];

    settings?: any;
    activities: Activity[];
    /** Resolved "home" page content — see lib/cms/page-registry.ts. Hidden sections are null. */
    content: Record<string, Record<string, string> | null>;
}

// Colour themes cycled across the event teaser cards (content comes from the CMS)
const EVENT_CARD_THEMES = [
    { color: "from-orange-500/20 to-orange-700/10", border: "border-orange-500/30", text: "text-orange-400" },
    { color: "from-green-500/20 to-green-700/10", border: "border-green-500/30", text: "text-green-400" },
    { color: "from-yellow-400/20 to-yellow-600/10", border: "border-yellow-400/30", text: "text-yellow-300" },
    { color: "from-pink-500/20 to-pink-700/10", border: "border-pink-500/30", text: "text-pink-400" },
];

export default function HomeContent({ stats, gallery, banners, reels, settings, activities, content }: HomeContentProps) {
    const { hero, about, attractions, gallery: galleryText, events, cta } = content;
    const phone = cta?.phone || "07349110865";
    // Each line is "<emoji> <label>"; a line without a leading emoji gets a default one
    const eventCards = listItems(events?.cards).map((line, i) => {
        const [first, ...rest] = line.split(" ");
        const hasEmoji = rest.length > 0 && !/^[\p{L}\p{N}]/u.test(first);
        return {
            emoji: hasEmoji ? first : "🎉",
            label: hasEmoji ? rest.join(" ") : line,
            ...EVENT_CARD_THEMES[i % EVENT_CARD_THEMES.length],
        };
    });

    return (
        <main className="bg-background text-white">
            {/* Hero Section */}
            {hero && <AnimatedHero content={hero} />}

            {/* Timing Cards — right below hero */}
            <TimingCardsClient />

            {/* Stats Section */}
            <section className="relative pt-12 md:pt-20 pb-16 md:pb-32 px-4 bg-background-light">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal animation="fade">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {stats.map((stat, index) => {
                                const Icon = iconMap[stat.icon] || Zap;
                                return (
                                    <motion.div
                                        key={stat.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                        className="text-center"
                                    >
                                        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/20 text-primary">
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <div className="text-4xl font-display font-black text-white mb-2">
                                            {stat.value}
                                        </div>
                                        <div className="text-white/60">{stat.label}</div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </ScrollReveal>
                    
                    {/* App Install Section */}
                    <ScrollReveal animation="slideUp" delay={0.4}>
                        <InstallAppSection />
                    </ScrollReveal>
                </div>
                <SectionDivider position="bottom" variant="wave" color="fill-background" />
            </section>

            {/* About Section */}
            {about && (
            <section className="relative py-12 md:py-20 px-4 bg-background">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <ScrollReveal animation="slideLeft">
                            <div>
                                <span className="inline-block py-1 px-3 rounded-full bg-secondary text-black font-bold text-sm mb-6 tracking-wider uppercase">
                                    {about.badge}
                                </span>
                                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black mb-6">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
                                        {about.title}
                                    </span>
                                </h2>
                                <p className="text-xl text-white/80 mb-6 leading-relaxed">
                                    {about.content}
                                </p>
                                <p className="text-xl text-white/80 leading-relaxed mb-8">
                                    {about.content2}
                                </p>
                                <Link href={about.button_link || "/about"}>
                                    <BouncyButton size="lg" variant="outline" className="text-white border-white" as="div">
                                        {about.button_text} <ArrowRight className="w-5 h-5 ml-2" />
                                    </BouncyButton>
                                </Link>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal animation="slideRight">
                            <div className="relative rounded-3xl overflow-hidden aspect-video lg:aspect-square">
                                <Image
                                    src={getMediaUrl(about.image) || "/images/gokidsplay/unnamed (4).webp"}
                                    alt="Kids enjoying the park"
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-cover rounded-3xl"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
                <SectionDivider position="bottom" variant="curve" color="fill-background" />
            </section>
            )}

            {/* Featured Attractions */}
            {attractions && (
            <section className="relative py-12 md:py-20 px-4 bg-background">
                <div className="max-w-7xl mx-auto">
                    {/* Activities Carousel */}
                    <div className="mb-12">
                        <Marquee speed={40}>
                            {activities.map((activity, index) => (
                                <div
                                    key={activity.id}
                                    className="mx-4 px-6 py-3 bg-gradient-to-r from-primary via-secondary to-accent rounded-full text-black font-bold text-lg whitespace-nowrap"
                                >
                                    {activity.name}
                                </div>
                            ))}
                        </Marquee>
                    </div>

                    <div className="text-center mt-12">
                        <Link href={attractions.button_link || "/attractions"}>
                            <BouncyButton size="lg" variant="primary" as="div">
                                {attractions.button_text} <ArrowRight className="w-5 h-5" />
                            </BouncyButton>
                        </Link>
                    </div>
                </div>
            </section>
            )}

            {/* Photo Gallery Section */}
            {galleryText && (
            <section className="relative pt-12 md:pt-20 pb-16 md:pb-32 px-4 bg-background-light">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal animation="slideUp" className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl lg:text-7xl font-display font-black mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-secondary">
                                {galleryText.title}
                            </span>
                        </h2>
                        <p className="text-base md:text-xl text-white/70 max-w-2xl mx-auto">
                            {galleryText.subtitle}
                        </p>
                    </ScrollReveal>

                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                        {gallery.length > 0 ? gallery.map((photo, index) => (
                            <ScrollReveal key={photo.id} animation="fade" delay={index * 0.1}>
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -10 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className="relative group overflow-hidden rounded-3xl cursor-pointer"
                                >
                                    <div className="aspect-[4/3] relative">
                                        <Image
                                            src={getMediaUrl(photo.src)}
                                            alt=""
                                            fill
                                            sizes="(max-width: 768px) 50vw, 33vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            onError={(e) => {
                                                e.currentTarget.srcset = "";
                                                e.currentTarget.src = "/images/gokidsplay/unnamed.webp";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </motion.div>
                            </ScrollReveal>
                        )) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-white/60 text-lg">No gallery images available yet. Check back soon!</p>
                            </div>
                        )}
                    </div>
                </div>
                <SectionDivider position="bottom" variant="wave" color="fill-background" />
            </section>
            )}

            {/* ✨ Special Events Section */}
            {events && (
            <section className="relative py-16 md:py-28 px-4 bg-background overflow-hidden">
                {/* Decorative background blobs */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <ScrollReveal animation="slideUp" className="text-center mb-14">
                        <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-accent/20 text-accent font-bold text-sm mb-5 tracking-wider uppercase border border-accent/30">
                            <CalendarHeart className="w-4 h-4" /> {events.badge}
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-7xl font-display font-black mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
                                {events.title}
                            </span>
                        </h2>
                        <p className="text-base md:text-xl text-white/70 max-w-2xl mx-auto">
                            {events.subtitle}
                        </p>
                    </ScrollReveal>

                    {/* Event type cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
                        {eventCards.map((event, i) => (
                            <ScrollReveal key={`${event.label}-${i}`} animation="fade" delay={i * 0.1}>
                                <Link href={events.button_link || "/events"}>
                                    <motion.div
                                        whileHover={{ scale: 1.05, y: -6 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                        className={`bg-gradient-to-br ${event.color} border ${event.border} rounded-3xl p-6 text-center cursor-pointer group h-full`}
                                    >
                                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">{event.emoji}</div>
                                        <p className={`font-bold text-sm md:text-base ${event.text}`}>{event.label}</p>
                                    </motion.div>
                                </Link>
                            </ScrollReveal>
                        ))}
                    </div>

                    <ScrollReveal animation="scale" className="text-center">
                        <Link href={events.button_link || "/events"}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold text-lg rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300"
                            >
                                <Sparkles className="w-5 h-5" />
                                {events.button_text}
                                <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </Link>
                    </ScrollReveal>
                </div>
                <SectionDivider position="bottom" variant="wave" color="fill-background-light" />
            </section>
            )}

            {/* Instagram Reels Section */}
            <InstagramReels reels={reels} />


            {/* CTA Section */}
            {cta && (
            <section className="relative py-16 md:py-32 px-4 bg-background-light">
                <div className="max-w-4xl mx-auto text-center">
                    <ScrollReveal animation="scale">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-8xl font-display font-black mb-6 leading-tight">
                            {cta.title}
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-secondary">
                                {cta.title_highlight}
                            </span>
                        </h2>
                        <p className="text-base md:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
                            {cta.subtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
                            <Link href={cta.button1_link || "/pricing"}>
                                <BouncyButton size="lg" variant="accent" as="div">
                                    {cta.button1_text}
                                </BouncyButton>
                            </Link>
                            <Link href={cta.button2_link || "/parties"}>
                                <BouncyButton size="lg" variant="secondary" as="div">
                                    {cta.button2_text}
                                </BouncyButton>
                            </Link>
                            <div className="w-full sm:w-auto text-center sm:text-left">
                                <p className="text-sm text-white/60 mb-1">{cta.phone_label}</p>
                                <a
                                    href={`tel:${phone.replace(/\s/g, '')}`}
                                    className="text-xl font-bold text-white hover:text-primary transition-colors"
                                >
                                    📞 {phone}
                                </a>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
            )}
        </main>
    );
}
