"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { BouncyButton } from "@repo/ui";
import { PricingTier } from "@repo/types";

interface PricingCardProps {
    tier: PricingTier;
    index: number;
}

export const PricingCard = ({ tier, index }: PricingCardProps) => {
    const isPopular = tier.isPopular;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, y: -10 }}
            className={`relative p-8 rounded-3xl backdrop-blur-md border-2 transition-all duration-300 ${isPopular
                    ? "bg-gradient-to-br from-primary/20 to-accent/20 border-primary shadow-neon-blue"
                    : "bg-surface-800/50 border-surface-700 hover:border-primary/50"
                }`}
        >
            {/* Best Value Badge */}
            {isPopular && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-accent to-secondary rounded-full"
                >
                    <div className="flex items-center gap-1 text-black font-bold text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>BEST VALUE</span>
                    </div>
                </motion.div>
            )}

            {/* Title */}
            <h3 className="text-2xl font-display font-bold text-white mb-2">
                {tier.title}
            </h3>

            {/* Price */}
            <div className="mb-6">
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-display font-black text-primary">
                        £{tier.price}
                    </span>
                    <span className="text-white/60">/{tier.duration}min</span>
                </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                    <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-start gap-3"
                    >
                        <div className="mt-0.5 flex-shrink-0">
                            <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                                <Check className="w-3 h-3 text-secondary" />
                            </div>
                        </div>
                        <span className="text-white/80">{feature}</span>
                    </motion.li>
                ))}
            </ul>

            {/* CTA */}
            <BouncyButton
                variant={isPopular ? "primary" : "outline"}
                className="w-full"
            >
                Book Now
            </BouncyButton>
        </motion.div>
    );
};
