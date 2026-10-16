import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { ScrollReveal, BouncyButton } from "@repo/ui";
import { Ticket, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getPublicPageContent, getPublicPricingPlans, getPublicSessionSettings, onlineFeeNote } from "@/lib/public-api";
import { listItems } from "@/lib/cms/page-registry";

export const metadata: Metadata = getMetadata(
    "Prices | Go Kids Play Coventry",
    "View the admission prices for Go Kids Play Coventry. All tickets include a 2-hour play session with access to Soft Play, Laser Arena, Go Karts, and more."
);

// Card colours cycle in order; the "popular" plan is highlighted separately
const TIER_COLORS = [
    "bg-blue-500/20 border-blue-500/40 text-blue-400",
    "bg-purple-500/20 border-purple-500/40 text-purple-400",
    "bg-primary/20 border-primary/40 text-primary",
    "bg-white/10 border-white/20 text-white/70",
];

const formatPrice = (price: string | number) => {
    const n = Number(price);
    return Number.isFinite(n) ? `£${n.toFixed(2)}` : String(price);
};

export default async function PricingPage() {
    const [content, plans, sessionSettings] = await Promise.all([
        getPublicPageContent("pricing"), getPublicPricingPlans(), getPublicSessionSettings(),
    ]);
    const feeNote = onlineFeeNote(sessionSettings);
    const { hero, notice, included, cards, footer } = content;
    const pricingTiers = plans
        .filter((p: any) => p.type === "SESSION")
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((p: any, i: number) => ({
            id: p.id,
            age: p.name,
            price: formatPrice(p.price),
            desc: p.description || "",
            popular: !!p.popular,
            color: TIER_COLORS[i % TIER_COLORS.length],
        }));

    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-5xl mx-auto">
                {hero && (
                    <div className="text-center mb-16">
                        <span className="inline-block py-1 px-4 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                            {hero.badge}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                            {hero.title}
                        </h1>
                        <p className="text-lg text-white/70 max-w-2xl mx-auto">{hero.subtitle}</p>
                    </div>
                )}

                {/* Important Info Banner */}
                {notice && (
                    <ScrollReveal animation="slideUp">
                        <div className="bg-surface-800/80 backdrop-blur-md border border-secondary/30 rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center gap-6 shadow-lg shadow-secondary/5">
                            <div className="w-16 h-16 rounded-full bg-secondary/20 flex flex-shrink-0 items-center justify-center">
                                <Clock className="w-8 h-8 text-secondary" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl font-bold text-white mb-1">{notice.title}</h3>
                                <p className="text-white/70">{notice.content}</p>
                            </div>
                        </div>
                    </ScrollReveal>
                )}

                {/* What's Included */}
                {included && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-center mb-6">{included.title}</h2>
                        <div className="flex flex-wrap justify-center gap-3">
                            {listItems(included.items).map((item) => (
                                <div key={item} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold">{item}</span>
                                </div>
                            ))}
                        </div>
                        {included.note && (
                            <p className="text-center text-white/50 text-sm mt-4 italic">{included.note}</p>
                        )}
                    </div>
                )}

                {/* Pricing Grid — prices come from Pricing Plans */}
                {cards && pricingTiers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {pricingTiers.map((tier: any, i: number) => (
                            <ScrollReveal key={tier.id} animation="slideUp" delay={i * 0.1}>
                                <div className={`relative bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border-2 transition-all h-full flex flex-col ${
                                    tier.popular ? 'border-primary shadow-lg shadow-primary/20 scale-105' : 'border-white/10 hover:border-white/30'
                                }`}>
                                    {tier.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black font-black text-[10px] uppercase tracking-wider py-1 px-3 rounded-full">
                                            {cards.popular_label}
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold text-white/90 mb-2">{tier.age}</h3>
                                    <div className="text-4xl font-black text-white mb-4">{tier.price}</div>
                                    <p className="text-sm text-white/60 flex-1 mb-6">{tier.desc}</p>

                                    <Link
                                        href={cards.select_link || "/book"}
                                        className={`mt-auto block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-colors border ${tier.color} hover:bg-white/5`}
                                    >
                                        {cards.select_text}
                                    </Link>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                )}

                {footer && (
                    <>
                        {(footer.note || feeNote) && (
                            <div className="text-center text-sm text-white/50 flex flex-col items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-white/40" />
                                {footer.note && <p>{footer.note}</p>}
                                {feeNote && <p className="text-yellow-300/80">{feeNote}</p>}
                            </div>
                        )}

                        <div className="mt-16 flex justify-center">
                            <Link href={footer.button_link || "/book"}>
                                <BouncyButton size="lg" variant="primary">
                                    <Ticket className="w-5 h-5 mr-2" />
                                    {footer.button_text}
                                </BouncyButton>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
