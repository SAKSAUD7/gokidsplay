"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { getMediaUrl } from "@/lib/media-utils";

import { isVideoEmbed, toEmbedUrl } from "@/lib/media-utils";

/** Fields come from the home page "hero" section (lib/cms/page-registry.ts). */
interface AnimatedHeroProps {
    content: Record<string, string>;
}

export function AnimatedHero({ content: c }: AnimatedHeroProps) {
    const backgroundImage = c.image || "/images/gokidsplay/unnamed.webp";
    const video = c.video;

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={getMediaUrl(backgroundImage) || "/images/gokidsplay/unnamed.webp"}
                    alt="Go Kids Play Coventry — Indoor Play Centre"
                    fill
                    priority
                    className="object-cover"
                />
                {video && (isVideoEmbed(video) ? (
                    <iframe
                        src={toEmbedUrl(video, { background: true })}
                        title="Go Kids Play"
                        allow="autoplay; encrypted-media"
                        className="absolute top-1/2 left-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    />
                ) : (
                    <video
                        src={getMediaUrl(video)}
                        poster={getMediaUrl(backgroundImage)}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ))}
                <div className="absolute inset-0 bg-black/50" />
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
                        {c.badge}
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
                        {c.title}
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-white text-base sm:text-lg md:text-xl lg:text-2xl mb-6 max-w-3xl mx-auto leading-relaxed px-2"
                >
                    {c.subtitle}
                </motion.p>

                {/* Go Kids Play Coventry Location — opens Google Maps */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mb-8 max-w-2xl mx-auto"
                >
                    <a
                        href={c.location_link || "https://www.google.com/maps/search/Go+Kids+Play+Coventry"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-cyan-600/90 border-2 border-cyan-400 rounded-2xl px-6 py-4 shadow-lg shadow-cyan-600/40 hover:bg-cyan-500/90 hover:scale-105 transition-all duration-200 cursor-pointer group"
                        title="Get directions to Go Kids Play Coventry on Google Maps"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-white font-black text-lg md:text-xl tracking-wide">
                                {c.location_text}
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
                        href={c.button1_link || "/book"}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold text-base sm:text-lg rounded-full shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 hover:scale-105 transition-all"
                    >
                        {c.button1_text}
                    </Link>
                    <Link
                        href={c.button2_link || "/party-booking"}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 text-white font-bold text-base sm:text-lg rounded-full shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70 hover:scale-105 transition-all"
                    >
                        {c.button2_text}
                    </Link>
                    <Link
                        href={c.button3_link || "/attractions"}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-transparent border-2 border-white text-white font-bold text-base sm:text-lg rounded-full hover:bg-white/10 transition-all"
                    >
                        {c.button3_text}
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
