import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock, Users, Star, ShieldCheck } from "lucide-react";

export const metadata: Metadata = getMetadata(
    "Indoor Go Karts Coventry",
    "Race to the finish line on our indoor Go Kart track at Go Kids Play Coventry. Safe, electric karts perfect for young racers."
);

const images = [
    "/images/gokidsplay/unnamed (9).webp",
    "/images/gokidsplay/unnamed (10).webp",
    "/images/gokidsplay/unnamed (11).webp",
    "/images/gokidsplay/unnamed (3).webp",
];

const features = [
    "Indoor electric racing track",
    "Safe, controlled speeds",
    "Helmets & safety gear provided",
    "Timed lap races",
    "Perfect for young beginners",
    "Track marshals on duty",
];

export default function GoKartsPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-24 pb-20">
            <section className="relative h-[55vh] min-h-[380px] overflow-hidden mb-16">
                <Image
                    src={images[0]}
                    alt="Go Karts at Go Kids Play Coventry"
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-10 left-0 right-0 text-center px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded-full text-blue-300 text-sm font-bold mb-3 uppercase tracking-wider">
                        🏎️ Go Karts
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                        Indoor Racing
                    </h1>
                    <p className="text-white/70 text-lg max-w-xl mx-auto">
                        Start your engines! Safe and fun indoor go-karting for kids.
                    </p>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 space-y-16">
                <section className="grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h2 className="text-3xl font-black mb-4 text-white">Race to the Finish Line</h2>
                        <p className="text-white/70 leading-relaxed mb-4">
                            Let your little ones experience the thrill of the track in our specially designed indoor electric Go Karts. 
                            Our track provides a safe environment for young drivers to navigate twists, turns, and straightaways.
                        </p>
                        <p className="text-white/70 leading-relaxed mb-6">
                            Safety is our top priority. All karts have controlled speeds, and our track marshals ensure everyone 
                            follows the rules. Helmets are provided, and drivers are briefed before they hit the pedal!
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {features.map((f) => (
                                <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {images.map((img, i) => (
                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden">
                                <Image src={img} alt={`Go Karts ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: <Clock className="w-6 h-6 text-blue-400" />, label: "Sessions", value: "Multiple Laps" },
                        { icon: <Users className="w-6 h-6 text-blue-400" />, label: "Age Range", value: "4-12 years" },
                        { icon: <Star className="w-6 h-6 text-blue-400" />, label: "Price", value: "From £4.95" },
                        { icon: <ShieldCheck className="w-6 h-6 text-blue-400" />, label: "Safety", value: "Helmets provided" },
                    ].map((item) => (
                        <div key={item.label} className="bg-surface-800/60 border border-blue-500/20 rounded-2xl p-5 text-center">
                            <div className="flex justify-center mb-2">{item.icon}</div>
                            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                            <p className="text-white font-bold">{item.value}</p>
                        </div>
                    ))}
                </section>

                <section className="text-center">
                    <Link
                        href="/book?activity=go-karts"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-lg rounded-full shadow-xl shadow-blue-500/30 hover:scale-105 hover:shadow-blue-500/50 transition-all"
                    >
                        Book Go Karts Now <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-4 text-white/40 text-sm">
                        Or call us · <a href="tel:07349110865" className="text-white/60 hover:text-white">07349110865</a>
                    </p>
                </section>
            </div>
        </main>
    );
}
