import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock, Users, Star, ShieldCheck } from "lucide-react";

export const metadata: Metadata = getMetadata(
    "Soft Play Coventry",
    "Go Kids Play's Soft Play Zone in Coventry — a safe and exciting 3-tier soft play frame with toddler area, tunnels, slides and ball pits. Perfect for children of all ages."
);

const images = [
    "/images/gokidsplay/unnamed (4).webp",
    "/images/gokidsplay/unnamed (5).webp",
    "/images/gokidsplay/unnamed (6).webp",
    "/images/gokidsplay/unnamed.webp",
];

const features = [
    "3-tier soft play frame",
    "Dedicated toddler area",
    "Tunnels, slides & ball pits",
    "Climbing frames",
    "Fully supervised sessions",
    "Socks required for hygiene",
];

export default function SoftPlayPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-24 pb-20">
            {/* Hero */}
            <section className="relative h-[55vh] min-h-[380px] overflow-hidden mb-16">
                <Image
                    src={images[0]}
                    alt="Soft Play at Go Kids Play Coventry"
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-10 left-0 right-0 text-center px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-yellow-300 text-sm font-bold mb-3 uppercase tracking-wider">
                        🧨 Soft Play
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                        Soft Play Zone
                    </h1>
                    <p className="text-white/70 text-lg max-w-xl mx-auto">
                        Coventry&apos;s most exciting soft play area for kids of all ages
                    </p>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 space-y-16">
                {/* About */}
                <section className="grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h2 className="text-3xl font-black mb-4 text-white">A World of Play Awaits</h2>
                        <p className="text-white/70 leading-relaxed mb-4">
                            Go Kids Play&apos;s Soft Play area is a safe and exciting zone for toddlers and young children.
                            With tunnels, slides, ball pits, and climbing frames, children can explore, bounce, and play
                            to their hearts&apos; content in a fully supervised environment.
                        </p>
                        <p className="text-white/70 leading-relaxed mb-6">
                            Our dedicated toddler area means even the smallest adventurers can join in safely, while older
                            children conquer the 3-tier soft play frame. Open weekends and school holidays.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {features.map((f) => (
                                <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                                    <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {images.map((img, i) => (
                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden">
                                <Image src={img} alt={`Soft Play ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Info Cards */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: <Clock className="w-6 h-6 text-yellow-400" />, label: "Sessions", value: "45 mins" },
                        { icon: <Users className="w-6 h-6 text-yellow-400" />, label: "Age Range", value: "All ages" },
                        { icon: <Star className="w-6 h-6 text-yellow-400" />, label: "Price", value: "From £6.95" },
                        { icon: <ShieldCheck className="w-6 h-6 text-yellow-400" />, label: "Safety", value: "Fully supervised" },
                    ].map((item) => (
                        <div key={item.label} className="bg-surface-800/60 border border-yellow-500/20 rounded-2xl p-5 text-center">
                            <div className="flex justify-center mb-2">{item.icon}</div>
                            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                            <p className="text-white font-bold">{item.value}</p>
                        </div>
                    ))}
                </section>

                {/* CTA */}
                <section className="text-center">
                    <Link
                        href="/book?activity=soft-play"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-black text-lg rounded-full shadow-xl shadow-yellow-500/30 hover:scale-105 hover:shadow-yellow-500/50 transition-all"
                    >
                        Book Soft Play Now <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-4 text-white/40 text-sm">
                        Or call us · <a href="tel:02476000000" className="text-white/60 hover:text-white">024 7600 0000</a>
                    </p>
                </section>
            </div>
        </main>
    );
}
