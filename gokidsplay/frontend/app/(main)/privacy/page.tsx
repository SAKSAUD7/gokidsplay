"use client";

import { ScrollReveal, SectionDivider } from "@repo/ui";
import { Lock, Eye, FileText, Shield } from "lucide-react";

export default function PrivacyPage() {
    const sections = [
        {
            title: "Information We Collect",
            icon: <Eye className="w-6 h-6 text-primary" />,
            content: [
                "We collect information you provide directly to us, such as when you book a ticket, sign a waiver, or contact us.",
                "This may include your name, email address, phone number, and payment information.",
                "We also automatically collect certain information about your device and how you interact with our website."
            ]
        },
        {
            title: "How We Use Your Information",
            icon: <FileText className="w-6 h-6 text-secondary" />,
            content: [
                "To process your bookings and payments.",
                "To send you confirmations, updates, and administrative messages.",
                "To respond to your comments and questions.",
                "To improve our website and services."
            ]
        },
        {
            title: "Data Security",
            icon: <Lock className="w-6 h-6 text-accent" />,
            content: [
                "We implement appropriate technical and organizational measures to protect your personal data.",
                "Your payment information is processed securely by our payment providers and is not stored on our servers."
            ]
        },
        {
            title: "Your Rights",
            icon: <Shield className="w-6 h-6 text-primary" />,
            content: [
                "You have the right to access, correct, or delete your personal information.",
                "You may opt out of receiving promotional communications from us at any time.",
                "If you have any questions about this Privacy Policy, please contact us."
            ]
        }
    ];

    return (
        <main className="min-h-screen bg-background text-white pt-24">
            {/* Header */}
            <section className="relative py-20 px-4 bg-gradient-to-b from-background-dark to-background">
                <div className="max-w-7xl mx-auto text-center">
                    <ScrollReveal animation="slideUp">
                        <h1 className="text-5xl md:text-7xl font-display font-black mb-6">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                Privacy Policy
                            </span>
                        </h1>
                        <p className="text-xl text-white/70 max-w-2xl mx-auto">
                            We are committed to protecting your privacy and ensuring your personal information is secure.
                        </p>
                    </ScrollReveal>
                </div>
                <SectionDivider position="bottom" variant="curve" color="fill-background" />
            </section>

            {/* Content */}
            <section className="relative py-16 px-4">
                <div className="max-w-4xl mx-auto space-y-12">
                    {sections.map((section, index) => (
                        <ScrollReveal key={index} animation="fade" delay={index * 0.1}>
                            <div className="bg-surface-800/50 p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-colors">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-white/5 p-3 rounded-xl">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-2xl font-display font-bold text-white">
                                        {section.title}
                                    </h2>
                                </div>
                                <ul className="space-y-4">
                                    {section.content.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-white/70">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </ScrollReveal>
                    ))}

                    <div className="text-center pt-12 border-t border-white/10">
                        <p className="text-white/50 text-sm">
                            Last updated: November 2025
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
