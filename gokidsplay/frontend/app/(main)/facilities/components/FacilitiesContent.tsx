"use client";

import { ScrollReveal } from "@repo/ui";
import { motion } from "framer-motion";
import { Coffee, Car, Baby, ShieldCheck, Wifi, Utensils, PartyPopper, Accessibility, Phone, Clock } from "lucide-react";
import Link from "next/link";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Coffee,
    Car,
    Baby,
    ShieldCheck,
    Wifi,
    Utensils,
    PartyPopper,
    Accessibility,
    Phone,
    Clock,
};

const defaultFacilities = [
    {
        id: "cafe",
        title: "On-Site Café",
        icon_name: "Coffee",
        description: "Relax in our spacious café offering a range of hot and cold drinks, fresh sandwiches, pizzas, and snacks. The perfect spot for parents to unwind while the kids play.",
        emoji: "☕",
        color: "from-amber-500/20 to-amber-700/10",
        border: "border-amber-500/30",
        accent: "text-amber-400"
    },
    {
        id: "wifi",
        title: "Free Wi-Fi",
        icon_name: "Wifi",
        description: "Stay connected throughout your visit. We offer fast, complimentary Wi-Fi across all seating and café areas.",
        emoji: "📶",
        color: "from-blue-500/20 to-blue-700/10",
        border: "border-blue-500/30",
        accent: "text-blue-400"
    },
    {
        id: "parking",
        title: "Customer Parking",
        icon_name: "Car",
        description: "On-site parking available for all customers. Please register your vehicle at reception on arrival. Maximum stay: 3 hours.",
        emoji: "🚗",
        color: "from-green-500/20 to-green-700/10",
        border: "border-green-500/30",
        accent: "text-green-400"
    },
    {
        id: "baby",
        title: "Baby Changing",
        icon_name: "Baby",
        description: "Fully equipped baby changing facilities in our restrooms, ensuring comfort for families with infants throughout their visit.",
        emoji: "👶",
        color: "from-pink-500/20 to-pink-700/10",
        border: "border-pink-500/30",
        accent: "text-pink-400"
    },
    {
        id: "party",
        title: "Party Rooms",
        icon_name: "PartyPopper",
        description: "Dedicated private party rooms for birthday celebrations, complete with vibrant décor, catering, and a dedicated party host.",
        emoji: "🎉",
        color: "from-purple-500/20 to-purple-700/10",
        border: "border-purple-500/30",
        accent: "text-purple-400"
    },
    {
        id: "security",
        title: "Secure Entry",
        icon_name: "ShieldCheck",
        description: "Your child's safety is our priority. Our secure entry & exit system ensures children cannot leave unaccompanied at any time.",
        emoji: "🔒",
        color: "from-cyan-500/20 to-cyan-700/10",
        border: "border-cyan-500/30",
        accent: "text-cyan-400"
    },
];

interface FacilityItem {
    id: number | string;
    title: string;
    description: string;
    icon_name?: string;
    icon?: string;
    active?: boolean;
    order?: number;
    image_url?: string;
}

export default function FacilitiesContent({ facilities }: { facilities: FacilityItem[] }) {
    // Use CMS data if available and non-empty, otherwise use beautiful defaults
    const items = facilities && facilities.length > 0
        ? facilities.map((f, i) => ({
            ...defaultFacilities[i % defaultFacilities.length],
            id: f.id,
            title: f.title || defaultFacilities[i % defaultFacilities.length].title,
            description: f.description || defaultFacilities[i % defaultFacilities.length].description,
            icon_name: f.icon_name || f.icon || defaultFacilities[i % defaultFacilities.length].icon_name,
        }))
        : defaultFacilities;

    return (
        <main className="min-h-screen bg-background text-white">
            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-4 overflow-hidden">
                {/* Background blobs */}
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 py-1.5 px-5 rounded-full bg-secondary/20 border border-secondary/40 text-secondary font-bold text-sm mb-6 tracking-wider uppercase"
                    >
                        On-Site Amenities
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent leading-tight"
                    >
                        Our Facilities
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto"
                    >
                        Everything you need for a comfortable, safe, and unforgettable visit at Go Kids Play Coventry.
                    </motion.p>
                </div>
            </section>

            {/* Facilities Grid */}
            <section className="pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((fac, i) => {
                            const IconComp = iconMap[fac.icon_name || "Coffee"] || Coffee;
                            return (
                                <ScrollReveal key={fac.id} animation="slideUp" delay={i * 0.08}>
                                    <motion.div
                                        whileHover={{ y: -6, scale: 1.01 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                        className={`relative bg-gradient-to-br ${fac.color} border ${fac.border} p-6 rounded-3xl h-full flex flex-col group cursor-default`}
                                    >
                                        {/* Emoji badge */}
                                        <div className="absolute top-4 right-4 text-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                            {fac.emoji}
                                        </div>

                                        {/* Icon */}
                                        <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors duration-300`}>
                                            <IconComp className={`w-7 h-7 ${fac.accent}`} />
                                        </div>

                                        <h3 className="text-xl font-black text-white mb-3">{fac.title}</h3>
                                        <p className="text-sm text-white/65 flex-1 leading-relaxed">{fac.description}</p>
                                    </motion.div>
                                </ScrollReveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <ScrollReveal animation="scale">
                        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 rounded-3xl p-8 md:p-12 text-center">
                            <div className="text-5xl mb-4">🎉</div>
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                                Planning a Visit or Party?
                            </h2>
                            <p className="text-white/70 mb-8 max-w-xl mx-auto">
                                Book your session online or enquire about our premium birthday party packages — all designed to create unforgettable memories.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/book"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-black font-black rounded-full text-lg hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-200"
                                >
                                    🎟️ Book Tickets
                                </Link>
                                <Link
                                    href="/parties"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-full text-lg hover:bg-white/20 hover:border-white/40 transition-all duration-200"
                                >
                                    🎂 Plan a Party
                                </Link>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </main>
    );
}
