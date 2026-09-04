"use client";

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMediaUrl } from "@/lib/media-utils";
import { ScrollReveal } from "@repo/ui";
import Image from "next/image";

interface CarouselImage {
    id: number;
    title: string;
    image_url: string;
    order: number;
    active: boolean;
}

interface PricingCarouselProps {
    images: CarouselImage[];
}

export default function PricingCarousel({ images }: PricingCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);

        // Auto-scroll logic
        const autoScrollInterval = setInterval(() => {
            if (scrollContainerRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

                // If we reached the end, scroll back to start
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    // Otherwise scroll right
                    const scrollAmount = clientWidth * 0.33; // Scroll one item width approx
                    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }
        }, 5000); // 5 seconds interval

        return () => {
            window.removeEventListener('resize', checkScroll);
            clearInterval(autoScrollInterval);
        };
    }, [images]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { clientWidth } = scrollContainerRef.current;
            const scrollAmount = clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            setTimeout(checkScroll, 300);
        }
    };

    if (!images || images.length === 0) return null;

    return (
        <ScrollReveal animation="fade">
            <div className="relative group w-full max-w-7xl mx-auto px-4">
                {/* Controls */}
                <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className="p-3 bg-black/50 text-white rounded-full backdrop-blur-sm border border-white/20 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto transition-all"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className="p-3 bg-black/50 text-white rounded-full backdrop-blur-sm border border-white/20 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto transition-all"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Carousel Tracks */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className="flex-none snap-center w-[85%] sm:w-[50%] md:w-[33%] aspect-video relative rounded-2xl overflow-hidden border border-white/10 shadow-lg"
                        >
                            <Image
                                src={getMediaUrl(img.image_url)}
                                alt={img.title || "Gallery image"}
                                fill
                                className="object-cover transition-transform duration-500 hover:scale-105"
                            />
                            {img.title && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-white font-medium text-sm truncate">{img.title}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </ScrollReveal>
    );
}
