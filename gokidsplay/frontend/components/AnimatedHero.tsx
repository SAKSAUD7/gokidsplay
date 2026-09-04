"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Ticket } from "lucide-react";
import Image from "next/image";
import { getMediaUrl } from "@/lib/media-utils";

interface AnimatedHeroProps {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
}

export function AnimatedHero({
    title = "GO KIDS PLAY",
    subtitle = "Leicester's home of Roller Skating, Ten Pin Bowling, and Arcade Games. The perfect place for fun, parties, and unforgettable memories!",
    backgroundImage = "/images/gokidsplay/unnamed.webp"
}: AnimatedHeroProps) {


    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={getMediaUrl(backgroundImage)}
                    alt="Go Kids Play Leicester"
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-6xl mx-auto pt-20">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-block mb-6"
                >
                    <div className="bg-yellow-400 text-black font-black text-sm md:text-base px-6 py-2 rounded-full uppercase tracking-wider">
                        Skating · Bowling · Arcade
                    </div>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-4 leading-tight"
                >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-pink-500">
                        {title}
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-white text-base sm:text-lg md:text-xl lg:text-2xl mb-6 max-w-3xl mx-auto leading-relaxed px-2"
                >
                    {subtitle}
                </motion.p>

                {/* Leicester Location Notice — opens Google Maps */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mb-8 max-w-2xl mx-auto"
                >
                    <a
                        href="https://www.google.com/maps/search/Spin+Pin+Bowling+Roller+Skating+Arcade+Navigation+Street+Leicester"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-cyan-600/90 border-2 border-cyan-400 rounded-2xl px-6 py-4 shadow-lg shadow-cyan-600/40 hover:bg-cyan-500/90 hover:scale-105 transition-all duration-200 cursor-pointer group"
                        title="Get directions on Google Maps"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-white font-black text-lg md:text-xl tracking-wide">
                                📍 Leicester City Centre · Navigation Street
                            </p>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white/70 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </div>
                        <p className="text-cyan-200/70 text-xs text-center mt-1">Click for directions →</p>
                    </a>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full sm:w-auto px-4"
                >
                    <Link
                        href="/book"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold text-base sm:text-lg rounded-full shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 hover:scale-105 transition-all"
                    >
                        Book Tickets Now
                    </Link>
                    <Link
                        href="/kiosk/waiver"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white font-bold text-base sm:text-lg rounded-full shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                        Sign Waiver
                    </Link>
                    <Link
                        href="/attractions"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-transparent border-2 border-white text-white font-bold text-base sm:text-lg rounded-full hover:bg-white/10 transition-all"
                    >
                        View Attractions
                    </Link>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2"
                >
                    <div className="w-1 h-2 bg-white/50 rounded-full" />
                </motion.div>
            </motion.div>
        </section>
    );
}
