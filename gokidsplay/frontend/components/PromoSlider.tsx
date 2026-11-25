"use client";

/**
 * Homepage promotions slider (Website Content → Home Page → Promotions slider).
 * The homepage only renders it when there is at least one promotion to show.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMediaUrl } from "@/lib/media-utils";

export interface Promotion {
    id: number;
    title: string;
    image_url: string;
    link?: string | null;
}

const AUTO_MS = 5000;

export function PromoSlider({ promotions }: { promotions: Promotion[] }) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchX = useRef<number | null>(null);
    const count = promotions.length;

    const go = useCallback((to: number) => setIndex(((to % count) + count) % count), [count]);

    useEffect(() => {
        if (count < 2 || paused) return;
        const timer = window.setInterval(() => setIndex(i => (i + 1) % count), AUTO_MS);
        return () => window.clearInterval(timer);
    }, [count, paused]);

    if (count === 0) return null;

    return (
        <section aria-label="Offers and promotions" className="relative px-4 pt-8 md:pt-12 bg-background">
            <div className="max-w-6xl mx-auto">
                <div
                    className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-black/40"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onTouchStart={e => { touchX.current = e.touches[0].clientX; setPaused(true); }}
                    onTouchEnd={e => {
                        const start = touchX.current;
                        touchX.current = null;
                        setPaused(false);
                        if (start === null) return;
                        const moved = e.changedTouches[0].clientX - start;
                        if (Math.abs(moved) > 40) go(index + (moved < 0 ? 1 : -1));
                    }}
                >
                    <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
                        {promotions.map((promo, i) => {
                            const src = getMediaUrl(promo.image_url);
                            const slide = (
                                <div className="relative w-full aspect-[16/9] md:aspect-[16/7]">
                                    {/* Blurred copy fills the frame, so any image shape looks right */}
                                    <img src={src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50" />
                                    <img src={src} alt={promo.title || "Go Kids Play offer"} loading={i === 0 ? "eager" : "lazy"}
                                        className="relative w-full h-full object-contain" />
                                </div>
                            );
                            const link = (promo.link || "").trim();
                            return (
                                <div key={promo.id} className="w-full shrink-0" aria-hidden={i !== index}>
                                    {link ? (
                                        <Link href={link} tabIndex={i === index ? 0 : -1} className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-primary">
                                            {slide}
                                        </Link>
                                    ) : slide}
                                </div>
                            );
                        })}
                    </div>

                    {count > 1 && (
                        <>
                            <button onClick={() => go(index - 1)} aria-label="Previous offer"
                                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={() => go(index + 1)} aria-label="Next offer"
                                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                                {promotions.map((promo, i) => (
                                    <button key={promo.id} onClick={() => go(i)} aria-label={`Show offer ${i + 1}`} aria-current={i === index}
                                        className={`h-2.5 rounded-full transition-all ${i === index ? "w-7 bg-primary" : "w-2.5 bg-white/60 hover:bg-white"}`} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
