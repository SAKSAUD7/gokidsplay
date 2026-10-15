import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import Link from "next/link";
import { Info, ShieldAlert, FileText, Cookie, Scale, Coffee, HelpCircle, PhoneCall } from "lucide-react";
import { ScrollReveal } from "@repo/ui";
import { getPublicPageContent } from "@/lib/public-api";
import { listItems } from "@/lib/cms/page-registry";

export const metadata: Metadata = getMetadata(
    "Information Hub | Go Kids Play",
    "Find all the important information about Go Kids Play Coventry including FAQs, Facilities, Policies, and Safety Guidelines."
);

// Icon chosen from the card's link
function iconFor(href: string) {
    if (href.includes("faq")) return <HelpCircle />;
    if (href.includes("facilit")) return <Coffee />;
    if (href.includes("cookie")) return <Cookie />;
    if (href.includes("right")) return <Scale />;
    if (href.includes("privacy") || href.includes("security")) return <ShieldAlert />;
    if (href.includes("term")) return <FileText />;
    if (href.includes("contact")) return <PhoneCall />;
    return <Info />;
}

export default async function InformationPage() {
    const { hero, cards } = await getPublicPageContent("information");
    const infoCards = listItems(cards?.cards).map((line) => {
        const [title = "", href = "/", desc = ""] = line.split("|").map((part) => part.trim());
        return { title, href, desc };
    });

    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-5xl mx-auto">
                {hero && (
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                            {hero.title}
                        </h1>
                        <p className="text-lg text-white/70 max-w-2xl mx-auto">{hero.subtitle}</p>
                    </div>
                )}

                {cards && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {infoCards.map((card, i) => (
                            <ScrollReveal key={`${card.href}-${i}`} animation="slideUp" delay={i * 0.1}>
                                <Link href={card.href} className="block group">
                                    <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-primary/50 transition-all h-full flex flex-col">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-transform">
                                            {iconFor(card.href)}
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                                        <p className="text-sm text-white/60 flex-1">{card.desc}</p>
                                        <div className="mt-4 pt-4 border-t border-white/10 text-primary text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                                            {cards.link_text}
                                        </div>
                                    </div>
                                </Link>
                            </ScrollReveal>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
