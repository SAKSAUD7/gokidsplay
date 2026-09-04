"use client";

import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

interface VideoSectionProps {
    videoUrl?: string;
    youtubeId?: string;
    title: string;
    description?: string;
    autoplay?: boolean;
    className?: string;
}

export const VideoSection = ({
    videoUrl,
    youtubeId,
    title,
    description,
    autoplay = false,
    className,
}: VideoSectionProps) => {
    const [isPlaying, setIsPlaying] = useState(autoplay);
    const [isInView, setIsInView] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
                if (entry.isIntersecting && autoplay && videoRef.current) {
                    videoRef.current.play();
                    setIsPlaying(true);
                } else if (!entry.isIntersecting && videoRef.current) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.5 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, [autoplay]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <motion.div
            ref={sectionRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={cn("relative rounded-3xl overflow-hidden group", className)}
        >
            {/* Video Container */}
            <div className="relative aspect-video bg-background-dark">
                {youtubeId ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&mute=${autoplay ? 1 : 0}`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                ) : videoUrl ? (
                    <>
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            loop
                            muted={autoplay}
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Play/Pause Button */}
                        <button
                            onClick={togglePlay}
                            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center"
                            >
                                {isPlaying ? (
                                    <Pause className="w-8 h-8 text-black" />
                                ) : (
                                    <Play className="w-8 h-8 text-black ml-1" />
                                )}
                            </motion.div>
                        </button>
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50">
                        <p>No video source provided</p>
                    </div>
                )}
            </div>

            {/* Title Overlay */}
            {(title || description) && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-2xl font-display font-bold text-white mb-2">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-white/80">{description}</p>
                    )}
                </div>
            )}
        </motion.div>
    );
};
