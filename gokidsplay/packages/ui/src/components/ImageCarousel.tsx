"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
    images: string[];
    interval?: number;
    className?: string;
}

export const ImageCarousel = ({ images, interval = 5000, className = "" }: ImageCarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    // Mount guard: prevents SSR/CSR hydration mismatch on Lucide icon aria-hidden attr
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const timer = setInterval(() => {
            nextSlide();
        }, interval);
        return () => clearInterval(timer);
    }, [currentIndex, interval, mounted]);

    const nextSlide = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1 === images.length ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 < 0 ? images.length - 1 : prev - 1));
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    return (
        <div className={`relative overflow-hidden rounded-3xl group ${className}`}>
            <div className="relative w-full" style={{ height: '400px' }}>
                <AnimatePresence initial={false} custom={direction}>
                    <motion.img
                        key={currentIndex}
                        src={images[currentIndex]}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="absolute w-full h-full object-cover"
                        alt={`Slide ${currentIndex + 1}`}
                    />
                </AnimatePresence>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>

            {/* Nav buttons: only rendered client-side to prevent aria-hidden SSR/CSR mismatch */}
            {mounted && (
                <>
                    <button
                        type="button"
                        onClick={prevSlide}
                        aria-label="Previous image"
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-primary hover:text-black transition-all opacity-0 group-hover:opacity-100 z-10"
                    >
                        <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={nextSlide}
                        aria-label="Next image"
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-primary hover:text-black transition-all opacity-0 group-hover:opacity-100 z-10"
                    >
                        <ChevronRight className="w-6 h-6" aria-hidden="true" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, index) => (
                    <button
                        type="button"
                        key={index}
                        onClick={() => {
                            setDirection(index > currentIndex ? 1 : -1);
                            setCurrentIndex(index);
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                            index === currentIndex ? "bg-primary w-8" : "bg-white/50 hover:bg-white"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};
