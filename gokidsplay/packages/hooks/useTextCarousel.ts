"use client";

import { useState, useEffect } from "react";

export const useTextCarousel = (texts: string[], interval: number = 3000) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % texts.length);
                setIsAnimating(false);
            }, 500);
        }, interval);

        return () => clearInterval(timer);
    }, [texts.length, interval]);

    return { currentText: texts[currentIndex], isAnimating };
};
