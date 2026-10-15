"use client";

import { useState } from "react";
import { ScrollReveal } from "@repo/ui";
import { FileText, HelpCircle, Shield, Lock, AlertCircle, Cookie, Info } from "lucide-react";
import { paragraphs } from "@/lib/cms/page-registry";

type Resolved = Record<string, Record<string, string> | null>;

interface GuidelinesContentProps {
    /** Resolved "guidelines" page content (hero + FAQ tab text) */
    content: Resolved;
    /** Resolved legal pages keyed by slug (terms, privacy, …) — the same text as /terms, /privacy, … */
    legal: Record<string, Resolved>;
    faqs: any[];
}

const LEGAL_TABS = [
    { id: "terms", label: "Terms & Conditions", icon: FileText, accent: "primary" },
    { id: "privacy", label: "Privacy Policy", icon: Shield, accent: "secondary" },
    { id: "disclaimer", label: "Disclaimer", icon: Info, accent: "accent" },
    { id: "cookies", label: "Cookies", icon: Cookie, accent: "primary" },
    { id: "rights", label: "Your Rights", icon: AlertCircle, accent: "accent" },
    { id: "security", label: "Security", icon: Lock, accent: "primary" },
] as const;

const ACCENT_HEADING: Record<string, string> = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
};

export default function GuidelinesContent({ content, legal, faqs }: GuidelinesContentProps) {
    const [activeTab, setActiveTab] = useState<string>("faqs");
    const { hero, faq } = content;

    const tabs = [
        { id: "faqs", label: "FAQs", icon: HelpCircle, count: faqs?.length || 0 },
        ...LEGAL_TABS.filter((tab) => legal[tab.id]?.page),
    ];

    const renderLegal = (slug: string, accent: string) => {
        const doc = legal[slug]?.page;
        if (!doc) return null;
        return (
            <div>
                <h2 className="text-3xl font-bold mb-4 text-white">{doc.title}</h2>
                {doc.updated && <p className="text-white/50 text-sm mb-6">{doc.updated}</p>}
                <div className="space-y-4">
                    {paragraphs(doc.body).map((block, i) =>
                        block.startsWith("## ") ? (
                            <h3 key={i} className={`text-xl font-bold mt-6 ${ACCENT_HEADING[accent]}`}>
                                {block.slice(3).trim()}
                            </h3>
                        ) : (
                            <p key={i} className="text-white/70 whitespace-pre-line leading-relaxed">
                                {block}
                            </p>
                        )
                    )}
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-background text-white">
            {/* Header */}
            {hero && (
                <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 bg-gradient-to-b from-background-dark to-background">
                    <div className="max-w-7xl mx-auto text-center">
                        <ScrollReveal animation="fade">
                            <span className="inline-block py-1 px-3 rounded-full bg-accent text-white font-bold text-sm mb-6 tracking-wider uppercase">
                                {hero.badge}
                            </span>
                        </ScrollReveal>
                        <ScrollReveal animation="slideUp" delay={0.2}>
                            <h1 className="text-5xl md:text-6xl lg:text-8xl font-display font-black mb-6 leading-tight">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                    {hero.title}
                                </span>
                            </h1>
                            <p className="text-base md:text-xl lg:text-2xl text-white/70 max-w-3xl mx-auto">
                                {hero.subtitle}
                            </p>
                        </ScrollReveal>
                    </div>
                </section>
            )}

            {/* Tabbed Content */}
            <section className="py-12 md:py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const count = "count" in tab ? tab.count : undefined;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-semibold transition-all ${activeTab === tab.id
                                        ? "bg-primary text-black"
                                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {count !== undefined && count > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-black/20 rounded-full text-xs">{count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-surface-800/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-8">
                        {activeTab === "faqs" && (
                            <div>
                                <h2 className="text-3xl font-bold mb-6 text-white">{faq?.title || "Frequently Asked Questions"}</h2>
                                {faqs && faqs.length > 0 ? (
                                    <div className="space-y-4">
                                        {faqs.map((item: any, index: number) => (
                                            <details key={item.id || index} className="group bg-white/5 rounded-lg p-4 border border-white/10">
                                                <summary className="cursor-pointer font-semibold text-lg text-white hover:text-primary transition-colors flex items-center gap-2">
                                                    <span className="group-open:rotate-90 transition-transform">▶</span>
                                                    {item.question}
                                                </summary>
                                                <p className="mt-3 ml-6 text-white/70 whitespace-pre-line">{item.answer}</p>
                                            </details>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-white/60">{faq?.empty_text || "No FAQs available at the moment."}</p>
                                )}
                            </div>
                        )}

                        {LEGAL_TABS.map((tab) => activeTab === tab.id && <div key={tab.id}>{renderLegal(tab.id, tab.accent)}</div>)}
                    </div>
                </div>
            </section>
        </main>
    );
}
