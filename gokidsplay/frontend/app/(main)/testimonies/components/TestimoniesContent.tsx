"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { getMediaUrl } from "@/lib/media-utils";
import Link from "next/link";
import { ScrollReveal } from "@repo/ui";

const PLATFORM_COLORS: Record<string, string> = {
    Google: "text-blue-400",
    Facebook: "text-blue-500",
    Tripadvisor: "text-green-400",
};

export interface Review {
    id: number;
    name: string;
    content: string;
    rating: number;
    platform?: string;
    review_date?: string;
    image_url?: string;
}

const AVATAR_COLORS = [
    "from-primary to-secondary",
    "from-accent to-primary",
    "from-secondary to-accent",
    "from-purple-500 to-pink-500",
    "from-orange-500 to-accent",
    "from-cyan-500 to-blue-500",
    "from-green-500 to-secondary",
    "from-red-500 to-pink-500",
    "from-yellow-500 to-orange-500",
];

export default function TestimoniesContent({
    reviews,
    content,
}: {
    /** Genuine reviews from the CMS (Customer Reviews) */
    reviews: Review[];
    /** Resolved "testimonies" page content — see lib/cms/page-registry.ts */
    content: Record<string, Record<string, string> | null>;
}) {
    const { hero, summary, cta } = content;
    const hasReviews = reviews.length > 0;
    const avgRating = hasReviews ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "0";
    const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
        stars: r,
        count: reviews.filter((rev) => rev.rating === r).length,
        pct: hasReviews ? Math.round((reviews.filter((rev) => rev.rating === r).length / reviews.length) * 100) : 0,
    }));
    const [page, setPage] = useState(0);
    const [filter, setFilter] = useState<number | null>(null);

    const filtered = filter ? reviews.filter((r) => r.rating === filter) : reviews;
    const perPage = 6;
    const pages = Math.ceil(filtered.length / perPage);
    const visible = filtered.slice(page * perPage, page * perPage + perPage);

    return (
        <main className="min-h-screen bg-background text-white">

            {/* Hero */}
            {hero && (
            <section className="relative pt-36 pb-16 px-4 overflow-hidden">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 py-1.5 px-5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 font-bold text-sm mb-6 uppercase tracking-wider"
                    >
                        <Star className="w-4 h-4 fill-yellow-400" /> {hero.badge}
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-black mb-5 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent leading-tight"
                    >
                        {hero.title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-white/70 max-w-xl mx-auto"
                    >
                        {hero.subtitle}
                    </motion.p>
                </div>
            </section>
            )}

            {/* Overall Rating Widget */}
            {summary && (
            <section className="pb-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <ScrollReveal animation="scale">
                        <div className="bg-surface-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row gap-10 items-center">
                            {/* Big Score */}
                            {hasReviews && (
                            <div className="text-center shrink-0">
                                <div className="text-8xl font-black text-white mb-2">{avgRating}</div>
                                <div className="flex justify-center gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <div className="text-white/50 text-sm">{reviews.length} reviews</div>
                            </div>
                            )}

                            {/* Distribution bars */}
                            {hasReviews ? (
                            <div className="flex-1 w-full space-y-2">
                                {ratingDist.map(({ stars, count, pct }) => (
                                    <div key={stars} className="flex items-center gap-3">
                                        <button
                                            onClick={() => setFilter(filter === stars ? null : stars)}
                                            className={`flex items-center gap-1 text-sm font-semibold min-w-[60px] transition-colors ${filter === stars ? "text-yellow-400" : "text-white/60 hover:text-white"}`}
                                        >
                                            {stars} <Star className="w-3 h-3 fill-current" />
                                        </button>
                                        <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${pct}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: (5 - stars) * 0.1 }}
                                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                                            />
                                        </div>
                                        <span className="text-white/50 text-xs min-w-[32px] text-right">{count}</span>
                                    </div>
                                ))}
                            </div>
                            ) : (
                                <p className="flex-1 text-white/60 text-center md:text-left">{summary.empty_text}</p>
                            )}

                            {/* CTA */}
                            <div className="text-center shrink-0">
                                <p className="text-white/60 text-sm mb-4 whitespace-pre-line">{summary.prompt}</p>
                                <a
                                    href={summary.review_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-black rounded-full text-sm hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-200"
                                >
                                    <Star className="w-4 h-4" />
                                    {summary.button_text}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
            )}

            {/* Filter by rating */}
            {filter !== null && (
                <div className="max-w-4xl mx-auto px-4 pb-6 flex items-center gap-3">
                    <span className="text-white/50 text-sm">Filtering by {filter}-star reviews</span>
                    <button
                        onClick={() => { setFilter(null); setPage(0); }}
                        className="text-xs text-primary underline hover:no-underline"
                    >
                        Clear filter
                    </button>
                </div>
            )}

            {/* Reviews Grid */}
            {hasReviews && (
            <section className="pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${page}-${filter}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                        >
                            {visible.map((review, i) => (
                                <motion.div
                                    key={review.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.07 }}
                                    className="bg-surface-800/50 backdrop-blur-md border border-white/8 rounded-3xl p-6 flex flex-col hover:border-white/20 transition-colors duration-300 group"
                                >
                                    {/* Quote icon */}
                                    <div className="mb-4 text-white/10 group-hover:text-primary/20 transition-colors">
                                        <Quote className="w-8 h-8" />
                                    </div>

                                    {/* Stars */}
                                    <div className="flex gap-1 mb-4">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className={`w-4 h-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-white/15"}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Text */}
                                    <p className="text-white/80 italic flex-1 mb-5 leading-relaxed text-sm">
                                        &ldquo;{review.content}&rdquo;
                                    </p>

                                    {/* Footer */}
                                    <div className="border-t border-white/8 pt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            {review.image_url ? (
                                                <img src={getMediaUrl(review.image_url)} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-black font-black text-sm shrink-0`}>
                                                    {review.name.trim().charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-white text-sm">{review.name}</div>
                                                <div className={`text-xs ${PLATFORM_COLORS[review.platform ?? ""] || "text-white/50"}`}>
                                                    {[review.platform, review.review_date].filter(Boolean).join(" · ")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-10">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            {Array.from({ length: pages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${i === page ? "bg-primary text-black scale-110" : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                                disabled={page === pages - 1}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </section>
            )}

            {/* CTA */}
            {cta && (
            <section className="pb-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <ScrollReveal animation="scale">
                        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border border-primary/20 rounded-3xl p-8 md:p-10 text-center">
                            <div className="flex justify-center gap-1 mb-4">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                                {cta.title}
                            </h2>
                            <p className="text-white/65 mb-8 max-w-lg mx-auto">
                                {cta.subtitle}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href={cta.button1_link || "/book"}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-black font-black rounded-full text-lg hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all"
                                >
                                    {cta.button1_text}
                                </Link>
                                <Link
                                    href={cta.button2_link || "/party-booking"}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-full text-lg hover:bg-white/20 transition-all"
                                >
                                    {cta.button2_text}
                                </Link>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
            )}
        </main>
    );
}
