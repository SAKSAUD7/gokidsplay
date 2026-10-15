"use client";

import { ScrollReveal, BouncyButton, SectionDivider } from "@repo/ui";
import { motion } from "framer-motion";
import { Users, Clock, Check, Trophy, Sparkles, Building2, Star } from "lucide-react";
import Link from "next/link";
import { getMediaUrl } from "@/lib/media-utils";
import { listItems } from "@/lib/cms/page-registry";

interface GroupsContentProps {
    packages: any[];
    benefits: any[];
    /** Resolved "groups" page content — see lib/cms/page-registry.ts. Hidden sections are null. */
    content: Record<string, Record<string, string> | null>;
}

const STEP_COLORS = ["primary", "secondary", "accent"] as const;
const STEP_CLASSES: Record<string, string> = {
    primary: "bg-primary/20 text-primary",
    secondary: "bg-secondary/20 text-secondary",
    accent: "bg-accent/20 text-accent",
};

export default function GroupsContent({ packages, benefits, content }: GroupsContentProps) {
    const { hero, packages: packagesText, how, help } = content;
    const heroImage = getMediaUrl(hero?.image) || "/images/gallery-1.jpg";
    const steps = listItems(how?.steps).map((line) => {
        const [title = "", desc = ""] = line.split("|").map((part) => part.trim());
        return { title, desc };
    });

    const getIcon = (iconName: string) => {
        const icons: any = {
            Users: <Users className="w-8 h-8" />,
            Clock: <Clock className="w-8 h-8" />,
            Trophy: <Trophy className="w-8 h-8" />,
            Sparkles: <Sparkles className="w-8 h-8" />,
            Building2: <Building2 className="w-8 h-8" />,
            Star: <Star className="w-8 h-8" />,
        };
        return icons[iconName] || <Users className="w-8 h-8" />;
    };

    const getIconSmall = (iconName: string) => {
        const icons: any = {
            Users: <Users className="w-6 h-6" />,
            Clock: <Clock className="w-6 h-6" />,
            Trophy: <Trophy className="w-6 h-6" />,
            Sparkles: <Sparkles className="w-6 h-6" />,
            Building2: <Building2 className="w-6 h-6" />,
            Star: <Star className="w-6 h-6" />,
        };
        return icons[iconName] || <Users className="w-6 h-6" />;
    };

    return (
        <main className="bg-background text-white min-h-screen pt-24">
            {/* Header */}
            {hero && (
            <section className="relative py-16 md:py-32 px-4 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={heroImage}
                        alt={hero.title}
                        className="w-full h-full object-cover opacity-30"
                        onError={(e) => {
                            e.currentTarget.src = "/hero-background.jpg";
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
                </div>
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <ScrollReveal animation="slideUp">
                        <span className="inline-block py-2 px-6 rounded-full bg-accent text-black font-black text-sm mb-6 tracking-widest uppercase">
                            {hero.badge}
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-black mb-6">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                {hero.title}
                            </span>
                        </h1>
                        <p className="text-base md:text-xl text-white/70 max-w-2xl mx-auto mb-8">
                            {hero.subtitle}
                        </p>
                    </ScrollReveal>
                </div>
            </section>
            )}

            {/* Benefits Section */}
            {benefits.length > 0 && (
                <section className="relative py-12 md:py-20 px-4 bg-background">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                            {benefits.map((benefit, index) => (
                                <ScrollReveal key={benefit.id || index} animation="scale" delay={index * 0.1}>
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        className="bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 text-primary">
                                            {getIconSmall(benefit.icon)}
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                                        <p className="text-sm text-white/60">{benefit.description}</p>
                                    </motion.div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Group Packages — shown once packages exist in the CMS */}
            {packagesText && packages.length > 0 && (
            <section className="relative px-4 pb-32 md:pb-40 bg-background">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal animation="fade" className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl lg:text-6xl font-display font-black mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-secondary">
                                {packagesText.title}
                            </span>
                        </h2>
                        <p className="text-base md:text-xl text-white/70 max-w-2xl mx-auto">
                            {packagesText.subtitle}
                        </p>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {packages.map((pkg, index) => (
                            <ScrollReveal key={pkg.id || index} animation="scale" delay={index * 0.1}>
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    className={`relative p-8 rounded-3xl border-2 ${pkg.popular
                                        ? 'border-secondary bg-surface-800/80'
                                        : 'border-white/10 bg-surface-800/50'
                                        } backdrop-blur-sm h-full flex flex-col`}
                                >
                                    {pkg.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-black font-bold py-1 px-4 rounded-full text-sm">
                                            {packagesText.popular_label}
                                        </div>
                                    )}

                                    <div className={`w-16 h-16 rounded-full bg-${pkg.color || 'primary'}/20 flex items-center justify-center mb-4 text-${pkg.color || 'primary'}`}>
                                        {getIcon(pkg.icon)}
                                    </div>

                                    <h3 className={`text-2xl font-display font-bold mb-2 text-${pkg.color || 'primary'}`}>
                                        {pkg.name}
                                    </h3>
                                    <p className="text-white/60 mb-4 text-sm">{pkg.description}</p>
                                    <p className="text-white/80 font-bold mb-6 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        {pkg.min_size}
                                    </p>

                                    <div className="mb-8">
                                        <span className="text-5xl font-black text-white">£{pkg.price}</span>
                                        <span className="text-white/60 text-sm ml-2">{pkg.price_note}</span>
                                    </div>

                                    <ul className="space-y-4 mb-8 flex-grow">
                                        {(pkg.features || []).map((feature: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-white/80">
                                                <Check className={`w-5 h-5 text-${pkg.color || 'primary'} shrink-0 mt-0.5`} />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link href={packagesText.button_link || "/contact#contactForm"} className="w-full">
                                        <BouncyButton size="lg" variant={pkg.color as any || 'primary'} className="w-full">
                                            {packagesText.button_text}
                                        </BouncyButton>
                                    </Link>
                                </motion.div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>
            )}

            {/* How It Works & help line */}
            {(how || help) && (
            <section className="relative py-12 md:py-20 px-4 bg-background-light">
                <div className="max-w-4xl mx-auto">
                    {how && steps.length > 0 && (
                    <ScrollReveal animation="fade">
                        <div className="bg-surface-800/50 backdrop-blur-md p-8 rounded-3xl border border-primary/30">
                            <h3 className="text-3xl font-display font-black mb-6 text-center">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                                    {how.title}
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {steps.map((step, i) => {
                                    const color = STEP_COLORS[i % STEP_COLORS.length];
                                    return (
                                        <div key={i} className="text-center">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-black text-xl ${STEP_CLASSES[color]}`}>
                                                {i + 1}
                                            </div>
                                            <h4 className="font-bold mb-2">{step.title}</h4>
                                            <p className="text-sm text-white/60">{step.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </ScrollReveal>
                    )}

                    {help && (
                    <div className="mt-12 text-center">
                        <ScrollReveal animation="scale">
                            <p className="text-white/70 mb-6">
                                {help.title}
                            </p>
                            <Link href={help.button_link || "/contact#contactForm"}>
                                <BouncyButton size="lg" variant="primary">
                                    {help.button_text}
                                </BouncyButton>
                            </Link>
                        </ScrollReveal>
                    </div>
                    )}
                </div>
                <SectionDivider position="bottom" variant="wave" color="fill-background" />
            </section>
            )}
        </main>
    );
}
