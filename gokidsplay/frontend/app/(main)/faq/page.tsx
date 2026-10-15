import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { ScrollReveal } from "@repo/ui";
import { getPublicFaqs, getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "FAQ's | Go Kids Play Coventry",
    "Frequently Asked Questions about Go Kids Play, including booking, age limits, food, and party rules."
);

export default async function FAQPage() {
    const [faqs, content] = await Promise.all([getPublicFaqs(), getPublicPageContent("faq")]);
    const hero = content.hero;
    const items = [...faqs].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto">
                {hero && (
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                            {hero.title}
                        </h1>
                        <p className="text-lg text-white/70">{hero.subtitle}</p>
                    </div>
                )}

                <div className="space-y-6">
                    {items.map((faq: any, i: number) => (
                        <ScrollReveal key={faq.id ?? i} animation="slideUp" delay={i * 0.1}>
                            <div className="bg-surface-800/50 p-6 rounded-2xl border border-white/10">
                                <h3 className="text-xl font-bold text-primary mb-3">{faq.question}</h3>
                                <p className="text-white/80 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                    {items.length === 0 && (
                        <p className="text-center text-white/60">
                            Questions? Call us or use the contact form and we&apos;ll be happy to help.
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
