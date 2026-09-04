"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Zap, Star, Shield } from "lucide-react";
import Link from "next/link";
import { getMediaUrl } from "@/lib/media-utils";

interface FacilityItem {
    id: number;
    name: string;
    description: string;
    icon?: string;
    image_url?: string;
    category?: string;
    active: boolean;
    order: number;
}

interface FacilityCategory {
    id: number;
    name: string;
    description?: string;
    icon?: string;
    order: number;
}

const iconMap: Record<string, any> = {
    CheckCircle, Zap, Star, Shield
};

export default function FacilitiesPage() {
    const [categories, setCategories] = useState<FacilityCategory[]>([]);
    const [items, setItems] = useState<FacilityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
        Promise.all([
            fetch(`${API}/cms/facility-categories/`).then(r => r.ok ? r.json() : []),
            fetch(`${API}/cms/facility-items/`).then(r => r.ok ? r.json() : []),
        ]).then(([cats, its]) => {
            setCategories(Array.isArray(cats) ? cats.sort((a: any, b: any) => a.order - b.order) : []);
            setItems(Array.isArray(its) ? its.filter((i: any) => i.active).sort((a: any, b: any) => a.order - b.order) : []);
        }).finally(() => setLoading(false));
    }, []);

    // Default facilities if CMS is empty
    const DEFAULT_FACILITIES = [
        {
            category: "Skating",
            items: [
                { name: "Indoor Skating Rink", desc: "Full-size indoor roller skating rink with professional flooring, disco lighting and music system", icon: "🛼" },
                { name: "Skate Hire", desc: "Quality quad skates available in all sizes from children to adult. Sanitised after each use", icon: "👟" },
                { name: "Beginner Lessons", desc: "Learn to skate with our qualified instructors. Sessions available for all ages", icon: "⭐" },
            ]
        },
        {
            category: "Bowling",
            items: [
                { name: "6 Professional Lanes", desc: "State-of-the-art ten pin bowling lanes with automatic scoring and bumper rails for kids", icon: "🎳" },
                { name: "Shoe Hire", desc: "Bowling shoes available for hire in all sizes, freshly sanitised for every visit", icon: "👞" },
                { name: "Lane-side Service", desc: "Order food and drinks direct to your lane — no need to leave the game!", icon: "🍕" },
            ]
        },
        {
            category: "Arcade",
            items: [
                { name: "50+ Arcade Machines", desc: "Classic and modern arcade games, air hockey, basketball shooters, claw machines and more", icon: "🕹️" },
                { name: "Token System", desc: "Buy tokens at reception — no card needed at the machines. Works for all ages", icon: "🪙" },
                { name: "Prize Redemption", desc: "Win tickets and redeem them for prizes at our redemption counter", icon: "🎁" },
            ]
        },
        {
            category: "Venue",
            items: [
                { name: "Café & Snack Bar", desc: "Fresh food, hot drinks, soft drinks and snacks available throughout your visit", icon: "☕" },
                { name: "Party Rooms", desc: "Private party rooms available to hire — perfect for birthdays and group celebrations", icon: "🎉" },
                { name: "Secure Lockers", desc: "Secure locker hire available at the venue to keep your belongings safe while you play", icon: "🔒" },
                { name: "Free Car Parking", desc: "Free car parking available adjacent to the venue — register your plate at reception", icon: "🚗" },
                { name: "Accessible Venue", desc: "Fully accessible venue with ramp access, accessible toilets and facilities for all visitors", icon: "♿" },
            ]
        },
    ];

    const hasData = categories.length > 0 || items.length > 0;

    return (
        <main className="min-h-screen bg-[#0a0118]">
            {/* Hero */}
            <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden pt-20">
                <div className="absolute inset-0 z-0">
                    <img src="/images/gokidsplay/unnamed (7).webp" alt="Go Kids Play Facilities" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60" />
                </div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block mb-4 bg-cyan-400 text-black font-black text-sm px-6 py-2 rounded-full uppercase tracking-wider"
                    >
                        What We Offer
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4"
                    >
                        Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">Facilities</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-white/80 text-lg max-w-2xl mx-auto"
                    >
                        Everything you need for the perfect day out at Go Kids Play Leicester
                    </motion.p>
                </div>
            </section>

            {/* Facilities Content */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="text-center text-white/60 py-20">Loading facilities...</div>
                    ) : hasData ? (
                        // CMS-driven content
                        <div className="space-y-12">
                            {categories.map((cat) => {
                                const catItems = items.filter(i => i.category === cat.name || i.category === String(cat.id));
                                return (
                                    <div key={cat.id}>
                                        <h2 className="text-2xl font-black text-white mb-6 border-b border-white/10 pb-3">{cat.name}</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {catItems.map(item => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    className="bg-white/5 border border-white/10 rounded-2xl p-6"
                                                >
                                                    {item.image_url && (
                                                        <img src={getMediaUrl(item.image_url)} alt={item.name} className="w-full h-40 object-cover rounded-xl mb-4" />
                                                    )}
                                                    <h3 className="text-white font-bold text-lg mb-2">{item.name}</h3>
                                                    <p className="text-white/60 text-sm">{item.description}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // Default static content
                        <div className="space-y-16">
                            {DEFAULT_FACILITIES.map((group, gi) => (
                                <div key={gi}>
                                    <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                                        <span className="text-3xl">{group.items[0].icon}</span>
                                        {group.category}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {group.items.map((item, ii) => (
                                            <motion.div
                                                key={ii}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: ii * 0.1 }}
                                                className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all"
                                            >
                                                <div className="text-4xl mb-4">{item.icon}</div>
                                                <h3 className="text-white font-bold text-lg mb-2">{item.name}</h3>
                                                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CTA */}
                    <div className="text-center mt-20">
                        <div className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20 rounded-3xl p-10 max-w-2xl mx-auto">
                            <h2 className="text-3xl font-black text-white mb-4">Ready to Visit?</h2>
                            <p className="text-white/70 mb-8">Book your session online or walk in — we welcome everyone!</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/book" className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-full hover:scale-105 transition-all">
                                    Book Now
                                </Link>
                                <Link href="/contact" className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all">
                                    Contact Us
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
