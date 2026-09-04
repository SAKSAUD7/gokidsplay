"use client";

import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/utils";

interface BouncyButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: "primary" | "secondary" | "accent" | "outline";
    size?: "sm" | "md" | "lg";
    children: ReactNode;
}

export const BouncyButton = ({
    children,
    className,
    variant = "primary",
    size = "md",
    as = "button",
    ...props
}: BouncyButtonProps & { as?: "button" | "div" | "a" }) => {
    const baseStyles = "relative font-bold rounded-full transition-colors flex items-center justify-center gap-2 overflow-hidden cursor-pointer";

    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary-light shadow-neon-blue",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-light shadow-neon-lime",
        accent: "bg-accent text-accent-foreground hover:bg-accent-light shadow-neon-pink",
        outline: "border-2 border-primary text-primary hover:bg-primary/10",
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    const Component = motion[as] as any;

    return (
        <Component
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
            <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
            />
        </Component>
    );
};
