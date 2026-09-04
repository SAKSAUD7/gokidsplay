"use client";

import { ScrollReveal, SectionDivider, BouncyButton } from "@repo/ui";
import { motion } from "framer-motion";
import { Heart, Shield, Users, Zap, Target, Award, Sparkles, Calendar, HelpCircle, Instagram, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { TimingCardsClient } from "@/components/TimingCardsClient";

interface AboutContentProps {
    values: any[];
    stats: any[];
    timeline: any[];
    faqs: any[];
    reels: any[];
    hero?: {
        title: string;
        subtitle: string;
        image: string;
    };
    story?: {
        title: string;
        content: string; // May need parsing if its rich text
        image: string;
    };
}

export default function AboutContent({ values, stats, timeline, faqs, reels, hero, story }: AboutContentProps) {
    const heroTitle = hero?.title || "Coventry's Best Indoor Play Centre";
    const heroSubtitle = hero?.subtitle || "Soft Play, Laser Arena, Go Karts, Inflatable Park — all under one roof. Fun for all ages at Go Kids Play Coventry.";

    return (
        <main className="min-h-screen bg-background text-white">
            {/* Hero */}
            <section className="relative pt-32 pb-20 px-4 bg-gradient-to-b from-background-dark to-background">
                <div className="max-w-7xl mx-auto text-center">
                    <ScrollReveal animation="fade">
                        <span className="inline-block py-1 px-3 rounded-full bg-secondary text-black font-bold text-sm mb-6 tracking-wider uppercase">
                            About Us
                        </span>
                    </ScrollReveal>
                    <ScrollReveal animation="slideUp" delay={0.2}>
                        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-display font-black mb-6 leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                {heroTitle}
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto">
                            {heroSubtitle}
                        </p>
                    </ScrollReveal>
                </div>
                <SectionDivider position="bottom" variant="curve" color="fill-background" />
            </section>

            {/* Timing Cards — below hero */}
            <TimingCardsClient />

            {/* Stats */}
            <section className="py-20 px-4 bg-background">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.length > 0 ? stats.map((stat, index) => (
                            <ScrollReveal key={stat.id || index} animation="scale" delay={index * 0.1}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="text-center p-8 bg-surface-800/50 backdrop-blur-md rounded-3xl border border-primary/30 h-full flex flex-col justify-center"
                                >
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary mb-4 mx-auto">
                                        <Zap className="w-6 h-6" />
                                        {/* Icon mapping could be improved based on stat label if needed, or passed from CMS */}
                                    </div>
                                    <div className="text-3xl md:text-5xl font-display font-black text-white mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-white/60">{stat.label}</div>
                                </motion.div>
                            </ScrollReveal>
                        )) : (
                            // Fallback Stats
                            [
                                { value: "4", label: "Epic Activities" },
                                { value: "5,000+", label: "Happy Visitors" },
                                { value: "100%", label: "Safe & Fun" },
                                { value: "5⭐", label: "Reviews" },
                            ].map((stat, index) => (
                                <ScrollReveal key={index} animation="scale" delay={index * 0.1}>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="text-center p-8 bg-surface-800/50 backdrop-blur-md rounded-3xl border border-primary/30 h-full flex flex-col justify-center"
                                    >
                                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary mb-4 mx-auto">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div className="text-3xl md:text-5xl font-display font-black text-white mb-2">
                                            {stat.value}
                                        </div>
                                        <div className="text-white/60">{stat.label}</div>
                                    </motion.div>
                                </ScrollReveal>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="relative py-20 px-4 bg-background-light">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <ScrollReveal animation="slideLeft">
                            <div>
                                <h2 className="text-5xl md:text-6xl font-display font-black mb-6">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
                                        {story?.title || "Our Story"}
                                    </span>
                                </h2>
                                <div className="text-xl text-white/80 mb-6 leading-relaxed space-y-4">
                                    {story?.content ? (
                                        <div dangerouslySetInnerHTML={{ __html: story.content }} />
                                    ) : (
                                        <>
                                            <p>Go Kids Play was founded with a simple mission: to create a safe, fun, and exciting space where children and families can enjoy incredible activities together in Coventry.</p>
                                            <p>Based at 310 Kingfield Road, Coventry, we've created the area's premier indoor play and party centre with Soft Play, Laser Arena, Go Karts, and an Inflatable Park — all under one roof.</p>
                                            <p>Whether you're looking for a fun family day out, a birthday party venue, or a school holiday adventure, Go Kids Play is your destination for unforgettable memories in Coventry.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal animation="slideRight">
                            <div className="relative rounded-3xl overflow-hidden aspect-square">
                                <Image
                                    src={story?.image || "/images/gokidsplay/unnamed (11).webp"}
                                    alt="Kids having fun at Go Kids Play Leicester"
                                    fill
                                    className="object-cover rounded-3xl"
                                    onError={(e) => {
                                        e.currentTarget.srcset = "";
                                        e.currentTarget.src = "/images/gokidsplay/unnamed (11).webp";
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
                <SectionDivider position="bottom" variant="wave" color="fill-background" />
            </section>

            {/* Our Journey (Timeline) */}
            <section className="py-20 px-4 bg-background">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal animation="fade" className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-black mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
                                Our Journey
                            </span>
                        </h2>
                    </ScrollReveal>

                    <div className="relative">
                        {/* Line */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-white/10 hidden md:block" />

                        <div className="space-y-12">
                            {timeline.length > 0 ? timeline.map((item, index) => (
                                <ScrollReveal key={item.id || index} animation={index % 2 === 0 ? "slideLeft" : "slideRight"}>
                                    <div className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`}>
                                        <div className="flex-1 w-full md:w-1/2" />
                                        <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-accent text-black font-bold border-4 border-background shrink-0 my-4 md:my-0">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className={`flex-1 w-full md:w-1/2 p-6 ${index % 2 === 0 ? "md:text-right md:pr-12" : "md:pl-12"}`}>
                                            <div className="text-accent font-bold text-xl mb-2">{item.year}</div>
                                            <h3 className="text-2xl font-display font-bold text-white mb-2">{item.title}</h3>
                                            <p className="text-white/70">{item.description || item.desc}</p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            )) : (
                                // Fallback Timeline
                                [
                                    { year: "2022", title: "The Vision", desc: "Conceptualised Coventry's premier indoor play centre — Soft Play, Laser Arena, Go Karts & Inflatables all under one roof" },
                                    { year: "2023", title: "Building Begins", desc: "Fitted out our Kingfield Road venue with state-of-the-art activities and a dedicated party centre" },
                                    { year: "2024", title: "Grand Opening", desc: "Opened our doors to thousands of excited visitors — Go Kids Play Coventry was born!" },
                                    { year: "2025", title: "Growing Strong", desc: "Expanded activities, launched party packages, and became Coventry's favourite family play centre" },
                                ].map((item, index) => (
                                    <ScrollReveal key={index} animation={index % 2 === 0 ? "slideLeft" : "slideRight"}>
                                        <div className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`}>
                                            <div className="flex-1 w-full md:w-1/2" />
                                            <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-accent text-black font-bold border-4 border-background shrink-0 my-4 md:my-0">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div className={`flex-1 w-full md:w-1/2 p-6 ${index % 2 === 0 ? "md:text-right md:pr-12" : "md:pl-12"}`}>
                                                <div className="text-accent font-bold text-xl mb-2">{item.year}</div>
                                                <h3 className="text-2xl font-display font-bold text-white mb-2">{item.title}</h3>
                                                <p className="text-white/70">{item.desc}</p>
                                            </div>
                                        </div>
                                    </ScrollReveal>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 px-4 bg-background-light">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal animation="fade" className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-black mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
                                Our Values
                            </span>
                        </h2>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.length > 0 ? values.map((value, index) => (
                            <ScrollReveal key={value.id || index} animation="slideUp" delay={index * 0.1}>
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    className={`p-8 bg-surface-800/50 backdrop-blur-md rounded-3xl border-2 border-secondary/30 hover:border-secondary transition-all h-full`}
                                >
                                    <div className={`w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mb-4 text-secondary`}>
                                        <Heart className="w-8 h-8" />
                                        {/* Icon mapping strategy or generic icon */}
                                    </div>
                                    <h3 className="text-2xl font-display font-bold mb-3 text-white">
                                        {value.title}
                                    </h3>
                                    <p className="text-white/70 leading-relaxed">
                                        {value.description || value.desc}
                                    </p>
                                </motion.div>
                            </ScrollReveal>
                        )) : (
                            <div className="col-span-full text-center text-white/60">Values loading...</div>
                        )}
                    </div>
                </div>
            </section>

            {/* People Reviews Section */}
            <section className="relative py-20 px-4 bg-background">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal animation="fade" className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-black mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-secondary">
                                People Reviews on Go Kids Play
                            </span>
                        </h2>
                        <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
                            Check out these amazing reviews from our visitors!
                        </p>
                    </ScrollReveal>

                    <div className="flex flex-wrap justify-center gap-6">
                        {reels.length > 0 ? reels.map((item, index) => (
                            <ScrollReveal key={item.id || index} animation="scale" delay={index * 0.1} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                                <a href={item.url || item.instagram_url} target="_blank" rel="noopener noreferrer" className="block group">
                                    <motion.div
                                        whileHover={{ y: -10 }}
                                        className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[9/16]"
                                    >
                                        <Image
                                            src={item.thumbnail_url || item.img || "/images/instagram/reel-1.jpg"}
                                            alt="Instagram Reel"
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-60"
                                        />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Play className="w-8 h-8 text-white fill-white ml-1" />
                                            </div>
                                            <h3 className="text-2xl font-display font-bold text-white mb-2">Watch Review</h3>
                                            <div className="flex items-center text-white/80 text-sm">
                                                <Instagram className="w-4 h-4 mr-2" />
                                                <span>View on Instagram</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </a>
                            </ScrollReveal>
                        )) : (
                            <div className="text-center w-full text-white/60">Check out our Instagram for reviews!</div>
                        )}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 px-4 bg-background-light">
                <div className="max-w-4xl mx-auto">
                    <ScrollReveal animation="fade" className="text-center mb-16">
                        <h2 className="text-5xl md:text-6xl font-display font-black mb-4">
                            <span className="text-white">Frequently Asked Questions</span>
                        </h2>
                        <p className="text-xl text-white/70">Got questions? We've got answers!</p>
                    </ScrollReveal>

                    <div className="space-y-6">
                        {faqs.length > 0 ? faqs.map((faq, index) => (
                            <ScrollReveal key={faq.id || index} animation="slideUp" delay={index * 0.1}>
                                <div className="bg-surface-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-primary/50 transition-colors">
                                    <h3 className="text-xl font-bold text-white mb-3 flex items-start">
                                        <HelpCircle className="w-6 h-6 text-primary mr-3 shrink-0 mt-1" />
                                        {faq.question || faq.q}
                                    </h3>
                                    <p className="text-white/70 ml-9 leading-relaxed">
                                        {faq.answer || faq.a}
                                    </p>
                                </div>
                            </ScrollReveal>
                        )) : (
                            <div className="text-center text-white/60">FAQs compiling...</div>
                        )}
                    </div>
                </div>
                <SectionDivider position="bottom" variant="wave" color="fill-background" />
            </section>

            {/* CTA */}
            <section className="relative py-32 px-4 pb-32 md:pb-40 bg-background">
                <div className="max-w-4xl mx-auto text-center">
                    <ScrollReveal animation="scale">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-black mb-6">
                            Join the
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-secondary">
                                Adventure!
                            </span>
                        </h2>
                        <p className="text-xl text-white/70 mb-10">
                            Come and experience Go Kids Play Coventry — the ultimate indoor play centre for the whole family!
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <Link href="/book">
                                <BouncyButton size="lg" variant="accent">
                                    Book Tickets
                                </BouncyButton>
                            </Link>
                            <Link href="/contact">
                                <BouncyButton size="lg" variant="outline" className="text-white border-white">
                                    Contact Us
                                </BouncyButton>
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </main>
    );
}
