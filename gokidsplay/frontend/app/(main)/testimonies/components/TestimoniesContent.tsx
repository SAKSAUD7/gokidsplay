"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { getMediaUrl } from "@/lib/media-utils";
import Link from "next/link";
import { ScrollReveal } from "@repo/ui";
import { GoogleG } from "@/components/GoogleG";

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
    /** Link to the original review (Google reviews) */
    review_url?: string;
}

/** Google rating and links from the Google Business Profile (see backend apps/cms/google_reviews.py) */
export interface GoogleSummary {
    rating: number | null;
    review_count: number | null;
    reviews_url: string;
    write_review_url: string;
    photos?: { url: string; width?: number; height?: number; author?: string; author_url?: string }[];
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
    google,
}: {
    /** Genuine reviews from the CMS (Customer Reviews), including those synced from Google */
    reviews: Review[];
    /** Resolved "testimonies" page content — see lib/cms/page-registry.ts */
    content: Record<string, Record<string, string> | null>;
    /** Overall Google rating and review links (null when unavailable) */
    google?: GoogleSummary | null;
}) {
    const { hero, summary, cta } = content;
    const hasReviews = reviews.length > 0;
    const googleRating = google?.rating ?? null;
    // "Leave a review" opens Google's write-a-review box once the business is connected
    const reviewLink = google?.write_review_url?.includes("writereview") ? google.write_review_url : (summary?.review_link || google?.write_review_url);
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
                            {/* Google rating (all Google reviews) */}
                            {googleRating !== null && (
                            <div className="text-center shrink-0">
                                <div className="flex items-center justify-center gap-2 mb-1 text-white/70 text-sm font-semibold">
                                    <GoogleG /> Google rating
                                </div>
                                <div className="text-8xl font-black text-white mb-2">{googleRating.toFixed(1)}</div>
                                <div className="flex justify-center gap-1 mb-2" aria-label={`${googleRating} out of 5 stars`}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`w-6 h-6 ${s <= Math.round(googleRating) ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
                                    ))}
                                </div>
                                {google?.review_count != null && (
                                    <a href={google.reviews_url} target="_blank" rel="noopener noreferrer" className="text-white/60 text-sm underline hover:text-white">
                                        Based on {google.review_count.toLocaleString("en-GB")} Google reviews
                                    </a>
                                )}
                            </div>
                            )}

                            {/* Big Score (reviews on this page) */}
                            {googleRating === null && hasReviews && (
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
                            {googleRating !== null ? (
                            <div className="flex-1 w-full text-center md:text-left">
                                <p className="text-white/70 mb-4">
                                    Here are some of the latest reviews families have left us on Google.
                                </p>
                                {google?.reviews_url && (
                                    <a href={google.reviews_url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-colors">
                                        <GoogleG className="w-4 h-4" /> Read all reviews on Google <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                            ) : hasReviews ? (
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
                                    href={reviewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-black rounded-full text-sm hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-200"
                                >
                                    <Star className="w-4 h-4" />
                                    {summary.button_text}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                                {googleRating === null && google?.reviews_url && (
                                    <a href={google.reviews_url} target="_blank" rel="noopener noreferrer"
                                        className="mt-3 flex items-center justify-center gap-1.5 text-sm text-white/60 underline hover:text-white">
                                        <GoogleG className="w-4 h-4" /> Read our reviews on Google
                                    </a>
                                )}
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
                                    {/* Quote icon (Google "G" for Google reviews) */}
                                    <div className="mb-4 flex items-start justify-between">
                                        <Quote className="w-8 h-8 text-white/10 group-hover:text-primary/20 transition-colors" />
                                        {review.platform === "Google" && <GoogleG className="w-5 h-5 opacity-90" />}
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
                                                <img src={getMediaUrl(review.image_url)} alt="" referrerPolicy="no-referrer" loading="lazy" className="w-10 h-10 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-black font-black text-sm shrink-0`}>
                                                    {review.name.trim().charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-white text-sm">{review.name}</div>
                                                <div className={`text-xs ${PLATFORM_COLORS[review.platform ?? ""] || "text-white/50"}`}>
                                                    {review.review_url ? (
                                                        <a href={review.review_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                            {[review.platform && `Posted on ${review.platform}`, review.review_date].filter(Boolean).join(" · ")}
                                                        </a>
                                                    ) : [review.platform, review.review_date].filter(Boolean).join(" · ")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {reviews.some((r) => r.platform === "Google" && r.review_url) && (
                        <p className="mt-6 text-center text-xs text-white/40 flex items-center justify-center gap-1.5">
                            <GoogleG className="w-3.5 h-3.5" /> Google reviews are shown as posted on Google
                            {google?.reviews_url && <> · <a href={google.reviews_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">see them all</a></>}
                        </p>
                    )}

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
