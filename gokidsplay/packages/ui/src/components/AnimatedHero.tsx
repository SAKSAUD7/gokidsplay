"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { BouncyButton } from "./BouncyButton";
import { SectionDivider } from "./SectionDivider";

// Inlined to avoid cross-package webpack resolution issues with @repo/hooks
function useTextCarousel(texts: string[], interval: number = 3000) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % texts.length);
                setIsAnimating(false);
            }, 500);
        }, interval);
        return () => clearInterval(timer);
    }, [texts.length, interval]);

    return { currentText: texts[currentIndex], isAnimating };
}

export const AnimatedHero = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    // Text carousel for the hero heading
    const carouselTexts = ["NINJA !!", "WARRIOR !!", "CHAMPION !!", "HERO !!"];
    const { currentText } = useTextCarousel(carouselTexts, 3000);

    return (
        <div ref={ref} className="relative min-h-[100vh] md:min-h-screen w-full overflow-hidden bg-background-dark pt-20">
            {/* Background Video/Image Parallax */}
            <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background-dark/90 z-10" />
                <img
                    src="/images/gokidsplay/inflatable-obstacle-course.jpg"
                    alt="Ninja Inflatable Park - Epic Adventure Awaits"
                    className="h-full w-full object-cover object-center"
                />
                {/* Floating Shapes Layer */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.div
                        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl"
                    />
                </div>
            </motion.div>

            {/* Content */}
            <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <span className="inline-block py-2 px-6 rounded-full bg-secondary text-black font-black text-sm mb-8 tracking-widest uppercase shadow-[0_0_20px_rgba(204,255,0,0.4)]">
                        India's Biggest Inflatable Park
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
                    className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-display font-black text-white mb-8 leading-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
                >
                    ARE YOU A <br />
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={currentText}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="text-transparent bg-clip-text bg-gradient-to-r from-primary-dark via-secondary-dark to-accent-dark filter drop-shadow-lg inline-block"
                        >
                            {currentText}
                        </motion.span>
                    </AnimatePresence>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 max-w-2xl mb-12 font-body font-medium drop-shadow-md"
                >
                    Get ready to jump, climb, bounce, and conquer the ultimate inflatable adventure! Experience thrills, laughter, and challenges that push your limits in the most exciting way.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-md mx-auto px-4"
                >
                    <Link href="/pricing" className="w-full sm:w-auto">
                        <BouncyButton size="md" variant="accent" className="shadow-neon-pink w-full sm:w-auto justify-center text-sm sm:text-base" as="div">
                            Book Tickets Now
                        </BouncyButton>
                    </Link>
                    <Link href="/attractions" className="w-full sm:w-auto">
                        <BouncyButton size="md" variant="outline" className="text-white border-white hover:bg-white/10 backdrop-blur-sm w-full sm:w-auto justify-center text-sm sm:text-base" as="div">
                            View Attractions
                        </BouncyButton>
                    </Link>
                </motion.div>
            </div>

            {/* Bottom Wave */}
            <SectionDivider position="bottom" variant="wave" color="fill-background" />
        </div>
    );
};
