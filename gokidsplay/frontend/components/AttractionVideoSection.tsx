'use client';

import React from 'react';

import { ScrollReveal } from "@repo/ui";

interface VideoData {
    title: string | null;
    video: string;
    thumbnail?: string | null;
}

interface AttractionVideoSectionProps {
    videoData?: VideoData | null;
}

// Helper function to convert YouTube URLs to embed URLs
function getYouTubeEmbedUrl(url: string): string | null {
    if (!url) return null;

    // Handle youtube.com/watch?v=VIDEO_ID
    if (url.includes('youtube.com/watch')) {
        try {
            const videoId = new URL(url).searchParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        } catch {
            return null;
        }
    }
    // Handle youtu.be/VIDEO_ID
    if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    // Handle youtube.com/shorts/VIDEO_ID
    if (url.includes('youtube.com/shorts/')) {
        const videoId = url.split('/shorts/')[1]?.split('?')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return null;
}

export default function AttractionVideoSection({ videoData }: AttractionVideoSectionProps) {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const isYouTube = videoData?.video && (
        videoData.video.includes('youtube.com') ||
        videoData.video.includes('youtu.be')
    );
    const youtubeEmbedUrl = isYouTube ? getYouTubeEmbedUrl(videoData.video) : null;

    React.useEffect(() => {
        // Only set up auto-play for regular video files, not YouTube embeds
        if (isYouTube) return;

        const videoElement = videoRef.current;
        if (!videoElement) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        videoElement.play().catch((e) => console.warn("Auto-play blocked:", e));
                    } else {
                        videoElement.pause();
                    }
                });
            },
            { threshold: 0.5 } // Play when 50% visible
        );

        observer.observe(videoElement);

        return () => {
            if (videoElement) observer.unobserve(videoElement);
        };
    }, [isYouTube]);

    // No video uploaded yet — render nothing rather than an admin placeholder on the public site
    if (!videoData || !videoData.video) {
        return null;
    }

    return (
        <section className="w-full py-16 md:py-24 relative z-10">
            <div className="container mx-auto px-4">
                {videoData.title && (
                    <div className="text-center mb-12">
                        <ScrollReveal animation="fade">
                            <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-primary font-bold text-xs md:text-sm mb-4 tracking-wider uppercase backdrop-blur-md border border-white/10">
                                Featured Video
                            </span>
                        </ScrollReveal>
                        <ScrollReveal animation="slideUp" delay={0.1}>
                            <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-4 uppercase tracking-tight">
                                {videoData.title}
                            </h2>
                        </ScrollReveal>
                        <ScrollReveal animation="slideUp" delay={0.2}>
                            <div className="w-24 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full" />
                        </ScrollReveal>
                    </div>
                )}

                <ScrollReveal animation="scale" delay={0.2}>
                    <div className="flex justify-center w-full">
                        {/* Phone-like container: Vertical aspect ratio, rounded corners, shadow */}
                        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/20 border-[6px] border-white/10 bg-surface-900/50 backdrop-blur-sm inline-block w-full max-w-sm aspect-[9/16]">

                            {/* Reflection/Glare effect */}
                            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none z-20" />

                            {isYouTube && youtubeEmbedUrl ? (
                                <iframe
                                    src={youtubeEmbedUrl}
                                    className="absolute inset-0 w-full h-full bg-black"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={videoData.title || "Attraction Video"}
                                />
                            ) : (
                                <video
                                    ref={videoRef}
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    poster={videoData.thumbnail || undefined}
                                    className="absolute inset-0 w-full h-full object-cover bg-black"
                                    src={videoData.video}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            )}

                            {/* Optional: Unmute button overlay if needed, currently pure background style */}
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
