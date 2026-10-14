"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, ExternalLink, ThumbsUp, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from "@repo/ui";

const reviews = [
    {
        name: "Sarah Jenkins",
        initial: "S",
        date: "August 2026",
        rating: 5,
        platform: "Google",
        text: "Absolutely fantastic place for a birthday party! The staff were incredibly helpful, the food was great, and the kids didn't want to leave. Highly recommend the Inflatable Park!",
        helpful: 14
    },
    {
        name: "David Smith",
        initial: "D",
        date: "July 2026",
        rating: 5,
        platform: "Google",
        text: "Great value for money. There's so much to do under one roof. My boys loved the Go Karts and the Laser Arena. We will definitely be coming back.",
        helpful: 11
    },
    {
        name: "Emma Williams",
        initial: "E",
        date: "June 2026",
        rating: 4,
        platform: "Google",
        text: "Very clean and well-organized. The toddler soft play area is perfect for my 2-year-old, and the café coffee is surprisingly good! Only minor thing is it can get busy on weekends.",
        helpful: 9
    },
    {
        name: "Michael Brown",
        initial: "M",
        date: "May 2026",
        rating: 5,
        platform: "Facebook",
        text: "We booked the ultimate party package and it was stress-free. The host took care of everything from start to finish. Best kids party venue in Coventry — period.",
        helpful: 18
    },
    {
        name: "Lisa Patel",
        initial: "L",
        date: "April 2026",
        rating: 5,
        platform: "Google",
        text: "My teenagers usually get bored easily, but the Laser Tag kept them entertained for hours. Great atmosphere and really friendly, patient staff.",
        helpful: 7
    },
    {
        name: "James Taylor",
        initial: "J",
        date: "March 2026",
        rating: 4,
        platform: "Google",
        text: "Really fun place! Book ahead at weekends as it fills up. The wipeout challenges on the inflatables are hilarious — both kids and adults were in tears laughing.",
        helpful: 12
    },
    {
        name: "Priya Sharma",
        initial: "P",
        date: "February 2026",
        rating: 5,
        platform: "Facebook",
        text: "Our daughter's 7th birthday here was absolutely magical. The party room was beautifully set up and the host was so patient with all 14 kids. 10/10 would book again!",
        helpful: 21
    },
    {
        name: "Tom Henderson",
        initial: "T",
        date: "January 2026",
        rating: 5,
        platform: "Google",
        text: "Brought my nephew here for the first time. He's 4 and absolutely loved the soft play and go karts — even though the karts are tiny! Great toddler friendly venue.",
        helpful: 6
    },
    {
        name: "Rachel Moore",
        initial: "R",
        date: "December 2025",
        rating: 5,
        platform: "Google",
        text: "Christmas party booking was seamless. Staff went above and beyond. The kids had a blast in the laser arena — that was the highlight for them. Highly recommended!",
        helpful: 15
    },
];

const PLATFORM_COLORS: Record<string, string> = {
    Google: "text-blue-400",
    Facebook: "text-blue-500",
};

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

const avgRating = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);
const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: reviews.filter((rev) => rev.rating === r).length,
    pct: Math.round((reviews.filter((rev) => rev.rating === r).length / reviews.length) * 100),
}));

export default function TestimoniesPage() {
    const [page, setPage] = useState(0);
    const [filter, setFilter] = useState<number | null>(null);

    const filtered = filter ? reviews.filter((r) => r.rating === filter) : reviews;
    const perPage = 6;
    const pages = Math.ceil(filtered.length / perPage);
    const visible = filtered.slice(page * perPage, page * perPage + perPage);

    return (
        <main className="min-h-screen bg-background text-white">

            {/* Hero */}
            <section className="relative pt-36 pb-16 px-4 overflow-hidden">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 py-1.5 px-5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 font-bold text-sm mb-6 uppercase tracking-wider"
                    >
                        <Star className="w-4 h-4 fill-yellow-400" /> What Parents Say
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-black mb-5 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent leading-tight"
                    >
                        Customer Reviews
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-white/70 max-w-xl mx-auto"
                    >
                        Don't just take our word for it — here's what Coventry families say about their Go Kids Play experience.
                    </motion.p>
                </div>
            </section>

            {/* Overall Rating Widget */}
            <section className="pb-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <ScrollReveal animation="scale">
                        <div className="bg-surface-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row gap-10 items-center">
                            {/* Big Score */}
                            <div className="text-center shrink-0">
                                <div className="text-8xl font-black text-white mb-2">{avgRating}</div>
                                <div className="flex justify-center gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <div className="text-white/50 text-sm">{reviews.length} reviews</div>
                            </div>

                            {/* Distribution bars */}
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

                            {/* CTA */}
                            <div className="text-center shrink-0">
                                <p className="text-white/60 text-sm mb-4">Visited us?<br />Share your experience!</p>
                                <a
                                    href="https://g.page/r/GoKidsPlayCoventry/review"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-black rounded-full text-sm hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-200"
                                >
                                    <Star className="w-4 h-4" />
                                    Leave a Review
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

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
                                    key={review.name + review.date}
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
                                        &ldquo;{review.text}&rdquo;
                                    </p>

                                    {/* Footer */}
                                    <div className="border-t border-white/8 pt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-black font-black text-sm shrink-0`}>
                                                {review.initial}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{review.name}</div>
                                                <div className={`text-xs ${PLATFORM_COLORS[review.platform] || "text-white/50"}`}>
                                                    {review.platform} · {review.date}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-white/30 text-xs">
                                            <ThumbsUp className="w-3 h-3" />
                                            {review.helpful}
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

            {/* CTA */}
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
                                Ready to Create Your Own Memory?
                            </h2>
                            <p className="text-white/65 mb-8 max-w-lg mx-auto">
                                Join thousands of Coventry families who've made unforgettable memories at Go Kids Play. Book your session or party today.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/book"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-black font-black rounded-full text-lg hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all"
                                >
                                    🎟️ Book Tickets
                                </Link>
                                <Link
                                    href="/party-booking"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-full text-lg hover:bg-white/20 transition-all"
                                >
                                    🎂 Book a Party
                                </Link>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </main>
    );
}
