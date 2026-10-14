import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock, Users, Star, ShieldCheck } from "lucide-react";

export const metadata: Metadata = getMetadata(
    "Inflatable Park Coventry",
    "Bounce, slide and play at Go Kids Play's massive indoor inflatable park in Coventry. Featuring obstacle courses, wipeout challenges, and drops."
);

const images = [
    "/images/gokidsplay/unnamed (12).webp",
    "/images/gokidsplay/2025-04-15.webp",
    "/images/gokidsplay/2025-05-01.webp",
    "/images/gokidsplay/unnamed.webp",
];

const features = [
    "Massive continuous bounce zone",
    "Giant inflatable slides",
    "Wipeout challenges & obstacles",
    "Dedicated toddler bounce area",
    "Grip socks required",
    "High-energy active fun",
];

export default function InflatableParkPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-24 pb-20">
            <section className="relative h-[55vh] min-h-[380px] overflow-hidden mb-16">
                <Image
                    src={images[0]}
                    alt="Inflatable Park at Go Kids Play Coventry"
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-10 left-0 right-0 text-center px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-300 text-sm font-bold mb-3 uppercase tracking-wider">
                        🪂 Inflatable Park
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-500">
                        Giant Bounce Park
                    </h1>
                    <p className="text-white/70 text-lg max-w-xl mx-auto">
                        Defy gravity in our massive indoor inflatable theme park.
                    </p>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 space-y-16">
                <section className="grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h2 className="text-3xl font-black mb-4 text-white">Wall-to-Wall Bouncing Fun</h2>
                        <p className="text-white/70 leading-relaxed mb-4">
                            Prepare to catch some air! Our Inflatable Park is a huge, continuous bounce arena filled with 
                            epic challenges. From scaling the giant slide to tackling the wipeout obstacles, it&apos;s the ultimate 
                            way to burn off energy.
                        </p>
                        <p className="text-white/70 leading-relaxed mb-6">
                            We haven&apos;t forgotten the little ones — there&apos;s a dedicated toddler area so they can bounce safely 
                            away from the bigger kids. Please note that special grip socks are required to use the park.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {features.map((f) => (
                                <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {images.map((img, i) => (
                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden">
                                <Image src={img} alt={`Inflatable Park ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: <Clock className="w-6 h-6 text-purple-400" />, label: "Sessions", value: "45 mins" },
                        { icon: <Users className="w-6 h-6 text-purple-400" />, label: "Age Range", value: "All ages" },
                        { icon: <Star className="w-6 h-6 text-purple-400" />, label: "Price", value: "From £9.85" },
                        { icon: <ShieldCheck className="w-6 h-6 text-purple-400" />, label: "Safety", value: "Grip socks req." },
                    ].map((item) => (
                        <div key={item.label} className="bg-surface-800/60 border border-purple-500/20 rounded-2xl p-5 text-center">
                            <div className="flex justify-center mb-2">{item.icon}</div>
                            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                            <p className="text-white font-bold">{item.value}</p>
                        </div>
                    ))}
                </section>

                <section className="text-center">
                    <Link
                        href="/book?activity=inflatable-park"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-violet-700 text-white font-black text-lg rounded-full shadow-xl shadow-purple-500/30 hover:scale-105 hover:shadow-purple-500/50 transition-all"
                    >
                        Book Inflatable Park <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-4 text-white/40 text-sm">
                        Or call us · <a href="tel:07349110865" className="text-white/60 hover:text-white">07349110865</a>
                    </p>
                </section>
            </div>
        </main>
    );
}
