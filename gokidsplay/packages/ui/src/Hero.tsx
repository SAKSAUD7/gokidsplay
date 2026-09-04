"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export const Hero = () => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
                <img
                    src="/park-group-fun.jpg"
                    alt="Ninja Inflatable Park"
                    className="w-full h-full object-cover"
                />
                {/* Gradient Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
                {/* Additional overlay for depth */}
                <div className="absolute inset-0 bg-primary/20" />
            </div>

            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            {/* Floating Shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ y: [0, -30, 0], rotate: [0, 180, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-20 left-10 w-32 h-32 bg-accent/30 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ y: [0, 40, 0], rotate: [360, 180, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-20 right-10 w-40 h-40 bg-accent/30 rounded-full blur-3xl"
                />
            </div>

            {/* Content */}
            <div className="relative z-10 container-custom text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="mb-6"
                    >
                        <div className="inline-block bg-accent px-6 py-3 rounded-full shadow-2xl">
                            <span className="text-black font-black text-sm md:text-base uppercase tracking-wider">
                                🏆 India's Biggest Inflatable Park
                            </span>
                        </div>
                    </motion.div>

                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="mb-8"
                    >
                        <img
                            src="/spinpin-logo.png"
                            alt="SpinPin"
                            className="mx-auto h-28 md:h-36 lg:h-44 w-auto object-contain drop-shadow-2xl"
                        />
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black text-white mb-6 leading-tight"
                    >
                        <span className="drop-shadow-2xl">Jump, Slide &</span>
                        <br />
                        <span className="relative inline-block">
                            <span className="text-accent drop-shadow-2xl">Conquer!</span>
                            <motion.div
                                className="absolute -bottom-3 left-0 right-0 h-4 bg-accent/30 -z-10 rounded-full blur-sm"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.7, duration: 0.8 }}
                            />
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-xl md:text-2xl lg:text-3xl text-white mb-12 max-w-4xl mx-auto font-bold leading-relaxed drop-shadow-2xl"
                    >
                        Experience <span className="text-accent">20,000 sq ft</span> of pure fun and adventure!
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                    >
                        <motion.a
                            href="/book"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group btn bg-accent hover:bg-accent-dark text-black font-black text-lg px-12 py-5 shadow-2xl rounded-full border-4 border-white/20"
                        >
                            <span>Book Your Adventure</span>
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.a>

                        <motion.a
                            href="#video"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group btn bg-white/10 backdrop-blur-md border-3 border-white text-white hover:bg-white hover:text-primary font-black text-lg px-12 py-5 rounded-full shadow-xl"
                        >
                            <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Watch Video</span>
                        </motion.a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto"
                    >
                        {[
                            { number: "20K+", label: "Sq Ft", icon: "📏" },
                            { number: "11+", label: "Attractions", icon: "🎯" },
                            { number: "50K+", label: "Happy Visitors", icon: "😊" },
                            { number: "100%", label: "Safe & Fun", icon: "🛡️" },
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/20 shadow-xl hover:bg-white/20 transition-all"
                                whileHover={{ y: -5 }}
                            >
                                <div className="text-3xl mb-2">{stat.icon}</div>
                                <div className="text-4xl md:text-5xl font-black text-accent mb-2 drop-shadow-lg">{stat.number}</div>
                                <div className="text-white font-bold uppercase tracking-wide text-xs md:text-sm">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <div className="w-6 h-10 border-2 border-white/70 rounded-full flex justify-center p-2 bg-white/10 backdrop-blur-sm">
                    <motion.div
                        className="w-1.5 h-3 bg-accent rounded-full shadow-lg"
                        animate={{ y: [0, 12, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                </div>
            </motion.div>
        </div>
    );
};
