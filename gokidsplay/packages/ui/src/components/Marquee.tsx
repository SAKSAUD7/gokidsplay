"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "../lib/utils";

interface MarqueeProps {
    children: ReactNode;
    direction?: "left" | "right";
    speed?: number;
    className?: string;
    pauseOnHover?: boolean;
}

export const Marquee = ({
    children,
    direction = "left",
    speed = 20,
    className,
    pauseOnHover = true,
}: MarqueeProps) => {
    return (
        <div className={cn("relative flex overflow-hidden w-full", className)}>
            <motion.div
                className="flex min-w-full shrink-0 gap-4 py-4"
                initial={{ x: direction === "left" ? 0 : "-100%" }}
                animate={{ x: direction === "left" ? "-100%" : 0 }}
                transition={{
                    duration: speed,
                    ease: "linear",
                    repeat: Infinity,
                }}
                whileHover={pauseOnHover ? { animationPlayState: "paused" } : undefined}
            >
                {children}
                {children}
            </motion.div>
            <motion.div
                className="flex min-w-full shrink-0 gap-4 py-4"
                initial={{ x: direction === "left" ? 0 : "-100%" }}
                animate={{ x: direction === "left" ? "-100%" : 0 }}
                transition={{
                    duration: speed,
                    ease: "linear",
                    repeat: Infinity,
                }}
                whileHover={pauseOnHover ? { animationPlayState: "paused" } : undefined}
            >
                {children}
                {children}
            </motion.div>
        </div>
    );
};
