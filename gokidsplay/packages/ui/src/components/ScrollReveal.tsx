"use client";

import { motion, useInView, UseInViewOptions } from "framer-motion";
import { useRef } from "react";
import { cn } from "../lib/utils";
import { fadeIn, slideUp, scaleBounce, slideInLeft, slideInRight } from "@repo/animations";

type AnimationType = "fade" | "slideUp" | "slideLeft" | "slideRight" | "scale";

interface ScrollRevealProps {
    children: React.ReactNode;
    animation?: AnimationType;
    delay?: number;
    duration?: number;
    className?: string;
    once?: boolean;
    threshold?: number;
}

export const ScrollReveal = ({
    children,
    animation = "slideUp",
    delay = 0,
    duration = 0.5,
    className,
    once = true,
    threshold = 0.2,
}: ScrollRevealProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, amount: threshold });

    const getVariants = () => {
        switch (animation) {
            case "fade": return fadeIn;
            case "slideUp": return slideUp;
            case "slideLeft": return slideInLeft;
            case "slideRight": return slideInRight;
            case "scale": return scaleBounce;
            default: return slideUp;
        }
    };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={getVariants()}
            transition={{ duration, delay, ease: "easeOut" }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
};
