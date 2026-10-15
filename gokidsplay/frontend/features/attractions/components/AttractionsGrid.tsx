"use client";

import { useState, useEffect } from "react";
import { ScrollReveal, BouncyButton } from "@repo/ui";
import { motion, AnimatePresence } from "framer-motion";
import { getMediaUrl } from "@/lib/media-utils";
import { ChevronDown, ChevronLeft, ChevronRight, MapPin, HelpCircle, Tag, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Activity {
    id: string;
    name: string;
    description: string;
    long_description?: string;
    imageUrl: string;
    image_url?: string;
    gallery?: string[];
    active: boolean;
    order: number;
    why_choose_us?: string;
    what_to_expect?: string;
    location_info?: string;
    activity_faqs?: Array<{ question: string; answer: string }>;
}

// Returns true only if there is real expandable content
function hasExpandedContent(activity: Activity): boolean {
    return !!(activity.why_choose_us?.trim()
        || activity.what_to_expect?.trim()
        || activity.location_info?.trim()
        || (activity.activity_faqs && activity.activity_faqs.length > 0)
        || activity.long_description?.trim()
        // fall back: description long enough that truncation hides useful info
        || (activity.description && activity.description.length > 250));
}

interface AttractionsGridProps {
    activities: Activity[];
}

// Per-activity Go Kids Play images
const ACTIVITY_IMAGES: Record<string, string[]> = {
    "soft play": [
        "/images/gokidsplay/unnamed (4).webp",
        "/images/gokidsplay/unnamed (5).webp",
        "/images/gokidsplay/unnamed (6).webp",
        "/images/gokidsplay/unnamed.webp",
    ],
    "laser": [
        "/images/gokidsplay/unnamed (1).webp",
        "/images/gokidsplay/unnamed (7).webp",
        "/images/gokidsplay/unnamed (8).webp",
        "/images/gokidsplay/unnamed (2).webp",
    ],
    "go kart": [
        "/images/gokidsplay/unnamed (9).webp",
        "/images/gokidsplay/unnamed (10).webp",
        "/images/gokidsplay/unnamed (11).webp",
        "/images/gokidsplay/unnamed (3).webp",
    ],
    "inflatable": [
        "/images/gokidsplay/unnamed (12).webp",
        "/images/gokidsplay/2025-04-15.webp",
        "/images/gokidsplay/2025-05-01.webp",
        "/images/gokidsplay/unnamed.webp",
    ],
};

const ACTIVITY_META: Record<string, {
    emoji: string;
    gradient: string;
    border: string;
    badge: string;
    glowColor: string;
    slug: string;
    price: string;
}> = {
    "soft play": {
        emoji: "🧨",
        gradient: "from-yellow-500 to-orange-600",
        border: "border-yellow-500/40 hover:border-yellow-400/70",
        badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
        glowColor: "shadow-yellow-500/20",
        slug: "soft-play",
        price: "From £6.95",
    },
    "laser": {
        emoji: "🔫",
        gradient: "from-red-600 to-pink-700",
        border: "border-red-500/40 hover:border-red-400/70",
        badge: "bg-red-500/20 text-red-300 border-red-500/30",
        glowColor: "shadow-red-500/20",
        slug: "laser-arena",
        price: "From £5.95",
    },
    "laser arena": {
        emoji: "🔫",
        gradient: "from-red-600 to-pink-700",
        border: "border-red-500/40 hover:border-red-400/70",
        badge: "bg-red-500/20 text-red-300 border-red-500/30",
        glowColor: "shadow-red-500/20",
        slug: "laser-arena",
        price: "From £5.95",
    },
    "go kart": {
        emoji: "🏎️",
        gradient: "from-blue-600 to-indigo-700",
        border: "border-blue-500/40 hover:border-blue-400/70",
        badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        glowColor: "shadow-blue-500/20",
        slug: "go-karts",
        price: "From £4.95",
    },
    "go karts": {
        emoji: "🏎️",
        gradient: "from-blue-600 to-indigo-700",
        border: "border-blue-500/40 hover:border-blue-400/70",
        badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        glowColor: "shadow-blue-500/20",
        slug: "go-karts",
        price: "From £4.95",
    },
    "inflatable": {
        emoji: "🪂",
        gradient: "from-purple-600 to-violet-700",
        border: "border-purple-500/40 hover:border-purple-400/70",
        badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        glowColor: "shadow-purple-500/20",
        slug: "inflatable-park",
        price: "From £9.85",
    },
    "inflatable park": {
        emoji: "🪂",
        gradient: "from-purple-600 to-violet-700",
        border: "border-purple-500/40 hover:border-purple-400/70",
        badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        glowColor: "shadow-purple-500/20",
        slug: "inflatable-park",
        price: "From £9.85",
    },
};

function getActivityMeta(name: string) {
    const lower = name?.toLowerCase() || "";
    for (const [key, val] of Object.entries(ACTIVITY_META)) {
        if (lower.includes(key.split(" ")[0])) return val;
    }
    return {
        emoji: "⭐",
        gradient: "from-primary to-secondary",
        border: "border-primary/40 hover:border-primary/70",
        badge: "bg-primary/20 text-primary border-primary/30",
        glowColor: "shadow-primary/20",
        slug: "",
        price: "From £9.95",
    };
}

function getActivityImages(activity: Activity): string[] {
    // Prefer CMS gallery array, then fall back to per-activity defaults
    if (activity.gallery && activity.gallery.length > 0) return activity.gallery;
    const lower = activity.name?.toLowerCase() || "";
    for (const [key, imgs] of Object.entries(ACTIVITY_IMAGES)) {
        if (lower.includes(key.split(" ")[0])) return imgs;
    }
    return [activity.imageUrl || "/images/gokidsplay/unnamed.webp"];
}

// Image Slider Component
function ActivityImageSlider({ images, name }: { images: string[]; name: string }) {
    const [current, setCurrent] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);

    // Auto-advance
    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % images.length);
        }, 3200);
        return () => clearInterval(timer);
    }, [images.length]);

    const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
    const next = () => setCurrent((c) => (c + 1) % images.length);

    // Touch swipe support
    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const diff = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
        setTouchStart(null);
    };

    return (
        <div
            className="relative h-56 sm:h-64 overflow-hidden group"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'pan-y' }}
        >
            {/* Slides */}
            <AnimatePresence mode="wait">
                <motion.img
                    key={current}
                    src={getMediaUrl(images[current])}
                    alt={name}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.5 }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/gokidsplay/unnamed.webp";
                    }}
                />
            </AnimatePresence>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />

            {/* Arrows — always visible on mobile, hover-revealed on desktop */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prev(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); next(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </>
            )}

            {/* Dot indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                            aria-label={`Show photo ${i + 1}`}
                            // min-h/min-w 0: opt out of the global 44px touch-target rule so the dots stay dots
                            className={`min-h-0 min-w-0 rounded-full transition-all ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export const AttractionsGrid = ({ activities }: AttractionsGridProps) => {
    const [showAll, setShowAll] = useState(false);
    const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

    const displayedActivities = showAll ? activities : activities.slice(0, 6);
    const hasMore = activities.length > 6;

    const toggleActivity = (id: string) => {
        setExpandedActivity(expandedActivity === id ? null : id);
    };

    return (
        <div className="py-20 px-4 md:px-8 bg-background">
            <div className="max-w-7xl mx-auto mb-12 text-center">
                <ScrollReveal animation="slideUp">
                    <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-3">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                            Choose Your Adventure
                        </span>
                    </h2>
                    <p className="text-white/60 text-lg max-w-xl mx-auto">
                        Soft Play · Laser Arena · Go Karts · Inflatable Park — something for every age at Go Kids Play Coventry.
                    </p>
                </ScrollReveal>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {displayedActivities.length > 0 ? (
                    displayedActivities.map((activity, index) => {
                        const meta = getActivityMeta(activity.name);
                        const images = getActivityImages(activity);

                        return (
                            <ScrollReveal
                                key={activity.id}
                                animation="slideUp"
                                delay={index * 0.1}
                            >
                                <motion.div
                                    whileHover={{ y: -6 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className={`group relative bg-surface-800 rounded-3xl border-2 ${meta.border} transition-all overflow-hidden flex flex-col h-full shadow-xl ${meta.glowColor}`}
                                >
                                    {/* Image Slider */}
                                    <div className="relative flex-shrink-0">
                                        <ActivityImageSlider images={images} name={activity.name} />

                                        {/* Activity badge top-left */}
                                        <div className={`absolute top-4 left-4 z-30 px-3 py-1.5 rounded-full border text-xs font-bold backdrop-blur-sm flex items-center gap-1.5 ${meta.badge}`}>
                                            <span>{meta.emoji}</span>
                                            <span>{activity.name}</span>
                                        </div>

                                        {/* Price badge top-right */}
                                        <div className="absolute top-4 right-4 z-30 px-2.5 py-1 rounded-full bg-black/70 border border-white/20 text-white text-xs font-bold backdrop-blur-sm flex items-center gap-1">
                                            <Tag className="w-3 h-3" />
                                            {meta.price}
                                        </div>

                                        {/* Title on image */}
                                        <div className="absolute bottom-8 left-4 right-4 z-20">
                                            <h3 className="text-2xl md:text-3xl font-display font-black text-white drop-shadow-lg">
                                                {activity.name}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex-grow flex flex-col">
                                        <p className="text-white/70 mb-4 line-clamp-3 text-sm leading-relaxed">
                                            {activity.description}
                                        </p>

                                        {/* Learn More / Dedicated Page Button */}
                                        {meta.slug && (
                                            <Link
                                                href={`/attractions/${meta.slug}`}
                                                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold rounded-xl transition-colors text-sm border border-white/10 mb-3"
                                            >
                                                Learn More <ChevronDown className="w-4 h-4 -rotate-90" />
                                            </Link>
                                        )}

                                        {/* Book Now Button */}
                                        <Link
                                            href={meta.slug ? `/book?activity=${meta.slug}` : "/book"}
                                            className={`mt-auto block w-full py-3.5 px-4 bg-gradient-to-r ${meta.gradient} text-white font-bold text-center rounded-xl hover:shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2`}
                                        >
                                            Book {activity.name} <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {expandedActivity === activity.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden px-6 pb-6 space-y-4 border-t border-white/10 pt-4"
                                            >
                                                {/* Why Choose Us */}
                                                {activity.why_choose_us?.trim() && (
                                                    <div>
                                                        <h4 className="text-base font-bold text-primary mb-2">Why Choose Us?</h4>
                                                        <div className="text-sm text-white/70 whitespace-pre-line leading-relaxed">
                                                            {activity.why_choose_us}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* What to Expect */}
                                                {activity.what_to_expect?.trim() && (
                                                    <div>
                                                        <h4 className="text-base font-bold text-secondary mb-2">What to Expect</h4>
                                                        <div className="text-sm text-white/70 whitespace-pre-line leading-relaxed">
                                                            {activity.what_to_expect}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Location Info */}
                                                {activity.location_info?.trim() && (
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                                                        <div className="text-sm text-white/70 leading-relaxed">
                                                            {activity.location_info}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Long description fallback — shown when specific fields are not yet seeded */}
                                                {!activity.why_choose_us?.trim() && !activity.what_to_expect?.trim() && !activity.location_info?.trim() && (
                                                    <div className="text-sm text-white/75 whitespace-pre-line leading-relaxed">
                                                        {activity.long_description?.trim() || activity.description}
                                                    </div>
                                                )}

                                                {/* FAQs */}
                                                {activity.activity_faqs && activity.activity_faqs.length > 0 && (
                                                    <div>
                                                        <h4 className="text-base font-bold text-accent mb-2 flex items-center gap-2">
                                                            <HelpCircle className="w-4 h-4" /> FAQs
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {activity.activity_faqs.map((faq, idx) => (
                                                                <details key={idx} className="group/faq">
                                                                    <summary className="cursor-pointer text-sm font-semibold text-white hover:text-primary transition-colors flex items-center gap-2">
                                                                        <span className="group-open/faq:rotate-90 transition-transform inline-block">▶</span>
                                                                        {faq.question}
                                                                    </summary>
                                                                    <p className="mt-2 ml-5 text-sm text-white/60">
                                                                        {faq.answer}
                                                                    </p>
                                                                </details>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </ScrollReveal>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-20">
                        <div className="text-6xl mb-4">🧨🔫🏎️🪂</div>
                        <p className="text-white/60 text-xl">Activities loading...</p>
                        <p className="text-white/40 text-sm mt-2">Soft Play · Laser Arena · Go Karts · Inflatable Park</p>
                    </div>
                )}
            </div>

            {/* Show All / Show Less Button */}
            {hasMore && (
                <div className="flex justify-center mt-12">
                    <BouncyButton
                        onClick={() => setShowAll(!showAll)}
                        className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary via-secondary to-accent text-black font-bold text-lg rounded-full hover:shadow-2xl hover:shadow-primary/50 transition-all"
                    >
                        {showAll ? 'Show Less' : `Show All ${activities.length} Activities`}
                        <ChevronDown className={`w-5 h-5 transition-transform ${showAll ? 'rotate-180' : 'group-hover:translate-y-1'}`} />
                    </BouncyButton>
                </div>
            )}
        </div>
    );
};
