import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import Link from "next/link";
import { Info, ShieldAlert, FileText, Cookie, Scale, MapPin, Coffee, HelpCircle, PhoneCall } from "lucide-react";
import { ScrollReveal } from "@repo/ui";

export const metadata: Metadata = getMetadata(
    "Information Hub | Go Kids Play",
    "Find all the important information about Go Kids Play Coventry including FAQs, Facilities, Policies, and Safety Guidelines."
);

const infoCards = [
    { title: "FAQ's", icon: <HelpCircle />, href: "/faq", desc: "Got questions? We've got answers." },
    { title: "Facilities", icon: <Coffee />, href: "/facilities", desc: "Discover what's available on-site." },
    { title: "Privacy Policy", icon: <ShieldAlert />, href: "/privacy", desc: "How we protect your data." },
    { title: "Cookies", icon: <Cookie />, href: "/cookies", desc: "Our cookie tracking policy." },
    { title: "Your Rights", icon: <Scale />, href: "/rights", desc: "Your data and legal rights." },
    { title: "Security", icon: <ShieldAlert />, href: "/security", desc: "Our on-site security measures." },
    { title: "Disclaimer", icon: <Info />, href: "/disclaimer", desc: "Legal disclaimers for the park." },
    { title: "Terms of Service", icon: <FileText />, href: "/terms", desc: "Rules and terms of booking." },
    { title: "Contact Us", icon: <PhoneCall />, href: "/contact", desc: "Get in touch with our team." },
];

export default function InformationPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        Information Hub
                    </h1>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Everything you need to know about visiting Go Kids Play Coventry. From our facilities to our legal policies.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {infoCards.map((card, i) => (
                        <ScrollReveal key={card.href} animation="slideUp" delay={i * 0.1}>
                            <Link href={card.href} className="block group">
                                <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-primary/50 transition-all h-full flex flex-col">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-transform">
                                        {card.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                                    <p className="text-sm text-white/60 flex-1">{card.desc}</p>
                                    <div className="mt-4 pt-4 border-t border-white/10 text-primary text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                                        View details &rarr;
                                    </div>
                                </div>
                            </Link>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </main>
    );
}
