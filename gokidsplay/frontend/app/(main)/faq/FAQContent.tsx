"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface Hero {
    title: string;
    subtitle: string;
    image: string;
}

interface FAQContentProps {
    hero: Hero;
    grouped: Record<string, any[]>;
    allFaqs: any[];
}

export default function FAQContent({ hero, grouped, allFaqs }: FAQContentProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [activeCategory, setActiveCategory] = useState<string>("all");

    const categories = ["all", ...Object.keys(grouped)];
    const displayFaqs = activeCategory === "all"
        ? allFaqs
        : (grouped[activeCategory] || []);

    return (
        <main className="bg-background min-h-screen pt-24 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero */}
                <div className="relative text-center mb-10 py-12 px-6 rounded-3xl overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src={hero.image}
                            alt="FAQ"
                            className="w-full h-full object-cover opacity-20"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative z-10"
                    >
                        <h1 className="text-5xl md:text-6xl font-display font-black mb-6">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                {hero.title}
                            </span>
                        </h1>
                        <p className="text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
                            {hero.subtitle}
                        </p>
                    </motion.div>
                </div>

                {/* Category filter tabs (only show if multiple categories) */}
                {categories.length > 2 && (
                    <div className="flex flex-wrap gap-2 mb-8 justify-center">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize ${activeCategory === cat
                                        ? "bg-primary text-black shadow-lg"
                                        : "bg-white/5 border border-white/15 text-white/60 hover:bg-white/10"
                                    }`}
                            >
                                {cat === "all" ? "All Questions" : cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* FAQ Accordion */}
                {displayFaqs.length === 0 ? (
                    <div className="text-center py-16 text-white/40">
                        <p className="text-lg">No FAQs available yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayFaqs.map((faq, index) => (
                            <motion.div
                                key={faq.id ?? index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.04 }}
                                className="bg-surface-800/50 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-white/10 hover:border-primary/30"
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                                >
                                    <span className="text-lg font-bold text-white pr-8">{faq.question}</span>
                                    <ChevronDown
                                        className={`w-6 h-6 text-primary flex-shrink-0 transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>
                                <motion.div
                                    initial={false}
                                    animate={{
                                        height: openIndex === index ? "auto" : 0,
                                        opacity: openIndex === index ? 1 : 0,
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-8 pb-6 text-white/70 leading-relaxed whitespace-pre-line">
                                        {faq.answer}
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Contact CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center bg-surface-800/50 backdrop-blur-md rounded-[3rem] p-12 shadow-xl border border-primary/20"
                >
                    <h2 className="text-3xl font-display font-black text-white mb-4">
                        Still Have Questions?
                    </h2>
                    <p className="text-lg text-white/70 mb-8">
                        Our friendly team is here to help! Give us a call or send us a message.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a
                            href="/contact"
                            className="inline-block bg-primary hover:bg-primary/90 text-black font-bold py-4 px-10 rounded-full shadow-lg transition-colors uppercase tracking-wide"
                        >
                            Contact Us
                        </a>
                        <a
                            href="tel:07349110865"
                            className="inline-block bg-surface-700 border-2 border-white/20 hover:border-primary text-white hover:text-primary font-bold py-4 px-10 rounded-full transition-colors uppercase tracking-wide"
                        >
                            📞 Call Us
                        </a>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
