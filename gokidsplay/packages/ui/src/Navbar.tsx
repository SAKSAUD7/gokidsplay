"use client";

import { ReactNode, useState, useEffect } from "react";
import { Menu, X, Phone, Zap, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { navLinks } from "@repo/config";
import Link from "next/link";

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? "bg-background-dark/95 backdrop-blur-md shadow-glass py-3"
                : "bg-transparent py-4"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="relative">
                            <img
                                src="/spinpin-logo.png"
                                alt="SpinPin"
                                className="h-12 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-neon-blue"
                            />
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.title}
                                href={link.href}
                                className="relative font-bold text-sm text-white/80 hover:text-primary transition-colors group"
                            >
                                {link.title}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300 shadow-neon-blue" />
                            </Link>
                        ))}

                        {/* Contact Info */}
                        <div className="flex items-center space-x-4 pl-4 border-l-2 border-white/20">
                            <a
                                href="tel:07349110865"
                                className="flex items-center space-x-2 text-white/80 hover:text-secondary transition-colors"
                            >
                                <Phone className="w-4 h-4" />
                                <span className="font-bold text-sm">07349110865</span>
                            </a>
                        </div>

                        {/* Book Now Button */}
                        <Link href="/book">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-accent text-white font-bold rounded-full shadow-neon-pink hover:shadow-neon-pink transition-all flex items-center gap-2"
                            >
                                <Zap className="w-4 h-4" />
                                Book Now
                            </motion.button>
                        </Link>

                        {/* Admin Login Button */}
                        <Link href="/admin/login">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 text-sm text-white/60 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-all flex items-center gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                Admin
                            </motion.button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center space-x-4">
                        <a href="tel:07349110865" className="text-primary">
                            <Phone className="w-5 h-5" />
                        </a>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                        >
                            {isOpen ? (
                                <X size={24} className="text-white" />
                            ) : (
                                <Menu size={24} className="text-white" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-background-dark/98 backdrop-blur-md border-t border-white/10 overflow-hidden"
                    >
                        <div className="max-w-7xl mx-auto px-4 py-6 space-y-2">
                            {navLinks.map((link, index) => (
                                <motion.div
                                    key={link.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        href={link.href}
                                        className="block px-4 py-3 text-base font-bold text-white hover:text-primary hover:bg-white/5 rounded-xl transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.title}
                                    </Link>
                                </motion.div>
                            ))}
                            <div className="pt-4 space-y-3">
                                <Link
                                    href="/book"
                                    className="block w-full text-center px-6 py-3 bg-accent text-white font-bold rounded-full shadow-neon-pink"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Zap className="w-4 h-4 inline mr-2" />
                                    Book Your Session
                                </Link>
                                <Link
                                    href="/admin/login"
                                    className="block w-full text-center px-6 py-3 text-white/60 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-all"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Lock className="w-4 h-4 inline mr-2" />
                                    Admin Login
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
