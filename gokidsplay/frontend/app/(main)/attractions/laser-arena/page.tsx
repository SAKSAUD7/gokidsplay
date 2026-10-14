import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock, Users, Star, ShieldCheck } from "lucide-react";

export const metadata: Metadata = getMetadata(
    "Laser Arena Coventry",
    "Experience the ultimate laser tag battle at Go Kids Play Coventry. State-of-the-art equipment, multi-level arena, and immersive effects."
);

const images = [
    "/images/gokidsplay/unnamed (1).webp",
    "/images/gokidsplay/unnamed (7).webp",
    "/images/gokidsplay/unnamed (8).webp",
    "/images/gokidsplay/unnamed (2).webp",
];

const features = [
    "Multi-level battle arena",
    "State-of-the-art vests & phasers",
    "Solo or team deathmatch",
    "Immersive fog & lighting",
    "Real-time scoring",
    "Briefing room before play",
];

export default function LaserArenaPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-24 pb-20">
            <section className="relative h-[55vh] min-h-[380px] overflow-hidden mb-16">
                <Image
                    src={images[0]}
                    alt="Laser Arena at Go Kids Play Coventry"
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-10 left-0 right-0 text-center px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/20 border border-red-500/40 rounded-full text-red-300 text-sm font-bold mb-3 uppercase tracking-wider">
                        🔫 Laser Arena
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">
                        Laser Tag Battle
                    </h1>
                    <p className="text-white/70 text-lg max-w-xl mx-auto">
                        Suit up and dive into Coventry&apos;s most thrilling indoor laser arena.
                    </p>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 space-y-16">
                <section className="grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h2 className="text-3xl font-black mb-4 text-white">Adrenaline Pumping Action</h2>
                        <p className="text-white/70 leading-relaxed mb-4">
                            Step into the darkness of our multi-level Laser Arena. Armed with state-of-the-art phasers, 
                            you&apos;ll navigate through fog, dodge laser fire, and outsmart your opponents in a highly immersive 
                            battle environment.
                        </p>
                        <p className="text-white/70 leading-relaxed mb-6">
                            Whether you&apos;re playing solo or teaming up with friends, our real-time scoring system keeps track 
                            of every tag. Perfect for older kids, teens, and even adults who want in on the action!
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {features.map((f) => (
                                <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                                    <Check className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {images.map((img, i) => (
                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden">
                                <Image src={img} alt={`Laser Arena ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: <Clock className="w-6 h-6 text-red-400" />, label: "Sessions", value: "20 mins" },
                        { icon: <Users className="w-6 h-6 text-red-400" />, label: "Age Range", value: "7+ years" },
                        { icon: <Star className="w-6 h-6 text-red-400" />, label: "Price", value: "From £5.95" },
                        { icon: <ShieldCheck className="w-6 h-6 text-red-400" />, label: "Safety", value: "Briefing required" },
                    ].map((item) => (
                        <div key={item.label} className="bg-surface-800/60 border border-red-500/20 rounded-2xl p-5 text-center">
                            <div className="flex justify-center mb-2">{item.icon}</div>
                            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                            <p className="text-white font-bold">{item.value}</p>
                        </div>
                    ))}
                </section>

                <section className="text-center">
                    <Link
                        href="/book?activity=laser-arena"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-red-600 to-pink-700 text-white font-black text-lg rounded-full shadow-xl shadow-red-500/30 hover:scale-105 hover:shadow-red-500/50 transition-all"
                    >
                        Book Laser Tag Now <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-4 text-white/40 text-sm">
                        Or call us · <a href="tel:07349110865" className="text-white/60 hover:text-white">07349110865</a>
                    </p>
                </section>
            </div>
        </main>
    );
}
