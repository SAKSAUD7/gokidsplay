"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface BouncyButtonProps {
    children: ReactNode;
    size?: "sm" | "md" | "lg";
    variant?: "primary" | "secondary" | "accent" | "outline";
    className?: string;
    as?: "button" | "div";
    onClick?: () => void;
}

export function BouncyButton({
    children,
    size = "md",
    variant = "primary",
    className = "",
    as = "button",
    onClick
}: BouncyButtonProps) {
    const sizeClasses = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    const variantClasses = {
        primary: "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70",
        secondary: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-400/50 hover:shadow-yellow-400/70",
        accent: "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70",
        outline: "bg-transparent border-2 border-white text-white hover:bg-white/10",
    };

    const Component = as === "button" ? motion.button : motion.div;

    return (
        <Component
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-all ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        >
            {children}
        </Component>
    );
}
