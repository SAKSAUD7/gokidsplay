import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { ScrollReveal, BouncyButton } from "@repo/ui";
import { Ticket, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = getMetadata(
    "Prices | Go Kids Play Coventry",
    "View the admission prices for Go Kids Play Coventry. All tickets include a 2-hour play session with access to Soft Play, Laser Arena, Go Karts, and more."
);

const pricingTiers = [
    {
        age: "Under 12 months",
        price: "£1.95",
        desc: "Access to toddler play area",
        color: "bg-blue-500/20 border-blue-500/40 text-blue-400"
    },
    {
        age: "Under 24 months",
        price: "£7.95",
        desc: "Access to toddler play area & soft play",
        color: "bg-purple-500/20 border-purple-500/40 text-purple-400"
    },
    {
        age: "24 months and above",
        price: "£12.95",
        desc: "Full access to all activities",
        color: "bg-primary/20 border-primary/40 text-primary",
        popular: true
    },
    {
        age: "Non-playing adult",
        price: "£4.95",
        desc: "Entry to the park and café",
        color: "bg-white/10 border-white/20 text-white/70"
    }
];

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <span className="inline-block py-1 px-4 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                        Admission
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                        Our Prices
                    </h1>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Your ticket gives you an action-packed 2-hour play session with access to all our amazing attractions.
                    </p>
                </div>

                {/* Important Info Banner */}
                <ScrollReveal animation="slideUp">
                    <div className="bg-surface-800/80 backdrop-blur-md border border-secondary/30 rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center gap-6 shadow-lg shadow-secondary/5">
                        <div className="w-16 h-16 rounded-full bg-secondary/20 flex flex-shrink-0 items-center justify-center">
                            <Clock className="w-8 h-8 text-secondary" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-bold text-white mb-1">Play Session is for 2 hours only</h3>
                            <p className="text-white/70">
                                Open SATURDAY, SUNDAY, SCHOOL & BANK HOLIDAYS. (10:00am - 5:30pm)
                            </p>
                        </div>
                    </div>
                </ScrollReveal>

                {/* What's Included */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-center mb-6">What's Included in Your Session?</h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        {["Mega Soft Play", "Laser Arena", "Go Karts", "Ninja Inflatable", "Tangle Tower", "Sports Pitch"].map((item) => (
                            <div key={item} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                <span className="text-sm font-semibold">{item}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-white/50 text-sm mt-4 italic">
                        * Plus a dedicated Toddler Play Area for under 5's!
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {pricingTiers.map((tier, i) => (
                        <ScrollReveal key={tier.age} animation="slideUp" delay={i * 0.1}>
                            <div className={`relative bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border-2 transition-all h-full flex flex-col ${
                                tier.popular ? 'border-primary shadow-lg shadow-primary/20 scale-105' : 'border-white/10 hover:border-white/30'
                            }`}>
                                {tier.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black font-black text-[10px] uppercase tracking-wider py-1 px-3 rounded-full">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-lg font-bold text-white/90 mb-2">{tier.age}</h3>
                                <div className="text-4xl font-black text-white mb-4">{tier.price}</div>
                                <p className="text-sm text-white/60 flex-1 mb-6">{tier.desc}</p>
                                
                                <Link href="/book" className="mt-auto block">
                                    <button className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors border ${tier.color} hover:bg-white/5`}>
                                        Select
                                    </button>
                                </Link>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

                {/* Note */}
                <div className="text-center text-sm text-white/50 flex flex-col items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-white/40" />
                    <p>Prices and availability are subject to change. Please ensure you select the correct age group when booking.</p>
                </div>
                
                <div className="mt-16 flex justify-center">
                    <Link href="/book">
                        <BouncyButton size="lg" variant="primary">
                            <Ticket className="w-5 h-5 mr-2" />
                            Book Tickets Now
                        </BouncyButton>
                    </Link>
                </div>
            </div>
        </main>
    );
}
