"use client";

import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Heart } from "lucide-react";
import Link from "next/link";
import { footerLinks, siteConfig } from "../lib/config";
import { useEffect, useState } from "react";

export const Footer = ({ settings, socialLinks }: { settings?: any; socialLinks?: any[] }) => {
    const defaultSocialLinks = [
        { icon: <Facebook className="w-5 h-5" />, href: siteConfig.links.facebook, label: "Facebook" },
        { icon: <Instagram className="w-5 h-5" />, href: siteConfig.links.instagram, label: "Instagram" },
        { icon: <Twitter className="w-5 h-5" />, href: siteConfig.links.twitter, label: "Twitter" },
    ];

    const [logoUrl, setLogoUrl] = useState("/gokidsplay-logo.png");

    useEffect(() => {
        // Fetch dynamic logo on mount
        const fetchLogo = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';
                const response = await fetch(`${apiUrl}/core/logos/active/`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.image_url) {
                        let url: string = data.image_url;
                        // Resolve relative paths
                        if (url.startsWith('/')) {
                            url = apiUrl.replace('/api/v1', '') + url;
                        }
                        // Only force HTTPS in production
                        if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
                            url = url.replace(/^http:\/\//i, 'https://');
                        }
                        setLogoUrl(url);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch logo:", error);
            }
        };
        fetchLogo();
    }, []);

    const linksToDisplay = socialLinks && socialLinks.length > 0 ? socialLinks.map((link: any) => {
        const platform = (link.platform || link.label || "").toLowerCase();
        let Icon = Facebook;
        if (platform.includes('instagram')) Icon = Instagram;
        else if (platform.includes('twitter')) Icon = Twitter;

        return {
            icon: <Icon className="w-5 h-5" />,
            href: link.url || link.href,
            label: link.platform || link.label
        };
    }) : defaultSocialLinks;

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
                                src={logoUrl}
                                alt="Go Kids Play"
                                className="h-16 w-auto drop-shadow-neon-blue"
                            />
                        </Link>
                        <p className="text-white/70 mb-6 max-w-sm">
                            {siteConfig.description}
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            {linksToDisplay.map((social) => (
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
                                    {social.icon}
                                </motion.a>
                            ))}
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
                            <div className="flex-1">
                                <div className="text-xs text-white/60">Visit Us</div>
                                <div className="font-bold text-white text-sm">
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
                        Made with <Heart className="w-4 h-4 text-accent fill-accent" /> &mdash; by{" "}
                        <a
                            href="https://saud-portfolio-eight.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent font-semibold hover:text-primary transition-colors duration-200 underline underline-offset-2"
                        >
                            saud.co
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};
