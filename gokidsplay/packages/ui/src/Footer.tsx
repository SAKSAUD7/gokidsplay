"use client";

import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Heart, Youtube, Linkedin } from "lucide-react";
import Link from "next/link";
import { footerLinks, siteConfig } from "@repo/config";

const iconMap: Record<string, any> = {
    FACEBOOK: Facebook,
    INSTAGRAM: Instagram,
    TWITTER: Twitter,
    YOUTUBE: Youtube,
    LINKEDIN: Linkedin
};

export const Footer = ({ settings, socialLinks = [] }: { settings?: any, socialLinks?: any[] }) => {
    const displayLinks = socialLinks && socialLinks.length > 0
        ? socialLinks.map(link => ({
            icon: iconMap[link.platform] ? iconMap[link.platform] : Facebook,
            platform: link.platform,
            href: link.url,
            label: link.platform
        }))
        : [
            { icon: Facebook, href: siteConfig.links.facebook, label: "Facebook", platform: "FACEBOOK" },
            { icon: Instagram, href: siteConfig.links.instagram, label: "Instagram", platform: "INSTAGRAM" },
            { icon: Twitter, href: siteConfig.links.twitter, label: "Twitter", platform: "TWITTER" },
        ];

    const phone = settings?.contactPhone || siteConfig.contact.phone;
    const email = settings?.contactEmail || siteConfig.contact.email;
    const address = settings?.address || siteConfig.contact.address;
    const mapUrl = settings?.mapUrl || siteConfig.contact.mapUrl;

    return (
        <footer className="relative bg-background-dark text-white pt-20 pb-10">
            {/* Decorative Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="inline-block mb-4">
                            <img
                                src="/gokidsplay-logo.png"
                                alt="Go Kids Play"
                                className="h-16 w-auto drop-shadow-neon-blue"
                            />
                        </Link>
                        <p className="text-white/70 mb-6 max-w-sm">
                            {siteConfig.description}
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            {displayLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <motion.a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-10 h-10 rounded-full bg-surface-800 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all shadow-neon-blue"
                                        aria-label={social.label}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </motion.a>
                                )
                            })}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {footerLinks.map((group) => (
                        <div key={group.title}>
                            <h3 className="text-lg font-display font-bold mb-4 text-secondary">
                                {group.title}
                            </h3>
                            <ul className="space-y-3">
                                {group.items.map((link) => (
                                    <li key={link.title}>
                                        <Link
                                            href={link.href}
                                            className="text-white/70 hover:text-primary transition-colors inline-block hover:translate-x-1 transform duration-200"
                                        >
                                            {link.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Contact Info Bar */}
                <div className="border-t border-white/10 pt-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.a
                            href={`tel:${phone}`}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-3 p-4 bg-surface-800/50 rounded-2xl border border-primary/20 hover:border-primary/50 transition-all"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Phone className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <div className="text-xs text-white/60">Call Us</div>
                                <div className="font-bold text-white">{phone}</div>
                            </div>
                        </motion.a>

                        <motion.a
                            href={`mailto:${email}`}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-3 p-4 bg-surface-800/50 rounded-2xl border border-secondary/20 hover:border-secondary/50 transition-all"
                        >
                            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                                <div className="text-xs text-white/60">Email Us</div>
                                <div className="font-bold text-white">{email}</div>
                            </div>
                        </motion.a>

                        <motion.a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-3 p-4 bg-surface-800/50 rounded-2xl border border-accent/20 hover:border-accent/50 transition-all"
                        >
                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <div className="text-xs text-white/60">Visit Us</div>
                                <div className="font-bold text-white text-sm line-clamp-1">
                                    {address}
                                </div>
                            </div>
                        </motion.a>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-white/60 text-sm">
                        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
                    </p>
                    <p className="text-white/60 text-sm flex items-center gap-1">
                        Made with <Heart className="w-4 h-4 text-accent fill-accent" /> for bouncing fun
                    </p>
                </div>
            </div>
        </footer>
    );
};
