"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

interface AttractionCardProps {
    title: string;
    description: string;
    image: string;
    video?: string;
    category?: string;
    intensity?: "low" | "medium" | "high";
    className?: string;
}

export const AttractionCard = ({
    title,
    description,
    image,
    video,
    category,
    intensity,
    className,
}: AttractionCardProps) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "relative h-96 w-full rounded-3xl bg-background-paper overflow-hidden cursor-pointer group perspective-1000",
                className
            )}
        >
            {/* Background Image/Video */}
            <div className="absolute inset-0 z-0">
                <img
                    src={image}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 transform transition-transform duration-500 translate-z-10">
                <div className="transform translate-y-4 transition-transform duration-500 group-hover:translate-y-0">
                    {category && (
                        <span className="inline-block px-3 py-1 mb-3 text-xs font-bold uppercase tracking-wider text-black bg-secondary rounded-full">
                            {category}
                        </span>
                    )}
                    <h3 className="text-3xl font-display font-bold text-white mb-2 leading-tight">
                        {title}
                    </h3>
                    <p className="text-white/80 line-clamp-2 mb-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        {description}
                    </p>
                </div>
            </div>

            {/* Shine Effect */}
            <div
                className="absolute inset-0 z-20 opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity duration-500"
                style={{
                    background:
                        "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.8) 25%, transparent 30%)",
                }}
            />
        </motion.div>
    );
};
