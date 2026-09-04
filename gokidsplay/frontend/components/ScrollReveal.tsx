"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    animation?: "fade" | "slideUp" | "slideLeft" | "slideRight" | "scale";
    delay?: number;
    className?: string;
}

export function ScrollReveal({
    children,
    animation = "fade",
    delay = 0,
    className = ""
}: ScrollRevealProps) {
    const animations = {
        fade: {
            initial: { opacity: 0 },
            whileInView: { opacity: 1 },
        },
        slideUp: {
            initial: { opacity: 0, y: 50 },
            whileInView: { opacity: 1, y: 0 },
        },
        slideLeft: {
            initial: { opacity: 0, x: -50 },
            whileInView: { opacity: 1, x: 0 },
        },
        slideRight: {
            initial: { opacity: 0, x: 50 },
            whileInView: { opacity: 1, x: 0 },
        },
        scale: {
            initial: { opacity: 0, scale: 0.8 },
            whileInView: { opacity: 1, scale: 1 },
        },
    };

    const selectedAnimation = animations[animation];

    return (
        <motion.div
            initial={selectedAnimation.initial}
            whileInView={selectedAnimation.whileInView}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
