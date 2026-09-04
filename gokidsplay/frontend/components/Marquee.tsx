"use client";

import { ReactNode } from "react";

interface MarqueeProps {
    children: ReactNode;
    speed?: number; // Speed is roughly pixels per second
}

export function Marquee({ children, speed = 50 }: MarqueeProps) {
    // Convert speed to duration (lower speed = longer duration)
    // Assuming a standard width of about 2000px for calculation
    const duration = 2000 / speed;

    return (
        <div className="overflow-hidden whitespace-nowrap flex w-full relative group">
            <div 
                className="inline-flex animate-marquee"
                style={{ animationDuration: `${duration}s` }}
            >
                <div className="inline-flex px-4 items-center">
                    {children}
                </div>
                <div className="inline-flex px-4 items-center">
                    {children}
                </div>
                <div className="inline-flex px-4 items-center">
                    {children}
                </div>
            </div>
            
            <style jsx>{`
                @keyframes marquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-33.33%);
                    }
                }
                .animate-marquee {
                    animation: marquee linear infinite;
                }
                /* Pause on hover */
                .group:hover .animate-marquee {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}
