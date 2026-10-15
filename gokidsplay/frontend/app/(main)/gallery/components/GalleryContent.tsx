"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ImageIcon, Camera } from "lucide-react";
import { getMediaUrl } from "@/lib/media-utils";


const LOCAL_FALLBACK_IMAGES = [
    { id: "l1", src: "/images/gokidsplay/unnamed (4).webp", title: "Soft Play Fun", category: "soft_play" },
    { id: "l2", src: "/images/gokidsplay/unnamed (1).webp", title: "Go Karts Action", category: "go_karts" },
    { id: "l3", src: "/images/gokidsplay/unnamed (9).webp", title: "Laser Arena", category: "laser_arena" },
    { id: "l4", src: "/images/gokidsplay/unnamed (12).webp", title: "Inflatable Park", category: "inflatable" },
    { id: "l5", src: "/images/gokidsplay/unnamed (5).webp", title: "Kids Having Fun", category: "general" },
    { id: "l6", src: "/images/gokidsplay/unnamed (7).webp", title: "Birthday Party", category: "parties" },
    { id: "l7", src: "/images/gokidsplay/unnamed (10).webp", title: "Play Area", category: "soft_play" },
    { id: "l8", src: "/images/gokidsplay/2025-04-15.webp", title: "Go Kids Play", category: "general" },
    { id: "l9", src: "/images/gokidsplay/unnamed (6).webp", title: "Adventure Time", category: "general" },
    { id: "l10", src: "/images/gokidsplay/unnamed (8).webp", title: "Family Fun", category: "general" },
    { id: "l11", src: "/images/gokidsplay/unnamed (11).webp", title: "Toddler Zone", category: "soft_play" },
    { id: "l12", src: "/images/gokidsplay/unnamed.webp", title: "Go Kids Play", category: "general" },
];

const CATEGORIES = [
    { value: "", label: "All Photos" },
    { value: "soft_play", label: "🏠 Soft Play" },
    { value: "go_karts", label: "🏎️ Go Karts" },
    { value: "laser_arena", label: "🔫 Laser Arena" },
    { value: "inflatable", label: "🎈 Inflatable" },
    { value: "parties", label: "🎂 Parties" },
    { value: "general", label: "📸 General" },
];

interface GalleryImage {
    id: string | number;
    src?: string;
    image_url?: string;
    title?: string;
    category?: string;
}

export default function GalleryContent({
    cmsImages,
    content,
}: {
    cmsImages: GalleryImage[];
    /** Resolved "gallery" page content — see lib/cms/page-registry.ts */
    content: Record<string, Record<string, string> | null>;
}) {
    const hero = content.hero;
    const [activeCategory, setActiveCategory] = useState("");
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    // Merge CMS images with fallbacks
    const allImages: GalleryImage[] = cmsImages && cmsImages.length > 0
        ? cmsImages.map((img) => ({
            ...img,
            src: img.image_url || img.src || "",
        }))
        : LOCAL_FALLBACK_IMAGES;

    const filtered = activeCategory
        ? allImages.filter((img) => img.category === activeCategory)
        : allImages;

    const openLightbox = (idx: number) => setLightboxIdx(idx);
    const closeLightbox = () => setLightboxIdx(null);

    const prev = useCallback(() => {
        setLightboxIdx((i) => (i !== null ? (i - 1 + filtered.length) % filtered.length : null));
    }, [filtered.length]);

    const next = useCallback(() => {
        setLightboxIdx((i) => (i !== null ? (i + 1) % filtered.length : null));
    }, [filtered.length]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (lightboxIdx === null) return;
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
            if (e.key === "Escape") closeLightbox();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightboxIdx, prev, next]);

    const currentImage = lightboxIdx !== null ? filtered[lightboxIdx] : null;

    return (
        <main className="min-h-screen bg-background text-white">
            {/* Hero Header */}
            <section className="relative pt-36 pb-16 px-4 overflow-hidden">
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-10 right-10 w-64 h-64 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 py-1.5 px-5 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold text-sm mb-6 uppercase tracking-wider"
                    >
                        <Camera className="w-4 h-4" />
                        {hero?.badge ?? "Photo Gallery"}
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-black mb-5 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent leading-tight"
                    >
                        {hero?.title ?? "Our Gallery"}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto"
                    >
                        {hero?.subtitle ?? "Take a look inside Coventry's ultimate indoor play centre. Real moments, real fun!"}
                    </motion.p>

                    {/* Stats row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center gap-8 mt-8"
                    >
                        {[
                            { label: "Photos", value: allImages.length + "+" },
                            { label: hero?.stat2_label ?? "Attractions", value: hero?.stat2_value ?? "6+" },
                            { label: hero?.stat3_label ?? "Happy Visitors", value: hero?.stat3_value ?? "5,000+" },
                        ].filter((stat) => stat.label || stat.value).map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-2xl font-black text-white">{stat.value}</div>
                                <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Category Filter */}
            <section className="pb-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setActiveCategory(cat.value)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                                    activeCategory === cat.value
                                        ? "bg-primary/20 border-primary/60 text-primary shadow-lg shadow-primary/20"
                                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-white/40 text-xs mt-4">
                        Showing {filtered.length} of {allImages.length} photos
                    </p>
                </div>
            </section>

            {/* Masonry Grid */}
            <section className="pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    {filtered.length === 0 ? (
                        <div className="text-center py-20 text-white/40">
                            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>No photos in this category yet.</p>
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
                        >
                            <AnimatePresence mode="popLayout">
                                {filtered.map((img, i) => (
                                    <motion.div
                                        key={img.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => openLightbox(i)}
                                        className={`relative group overflow-hidden rounded-2xl cursor-pointer ${
                                            // Make some cards taller for a masonry-like feel
                                            i % 7 === 0 || i % 7 === 4 ? "aspect-[3/4]" : "aspect-square"
                                        }`}
                                    >
                                        <Image
                                            src={getMediaUrl(img.src || "")}
                                            alt={img.title || `Go Kids Play Gallery Image ${i + 1}`}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            className="object-cover transition-all duration-500 group-hover:scale-110"
                                            onError={(e) => {
                                                e.currentTarget.src = "/images/gokidsplay/unnamed.webp";
                                            }}
                                        />

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end p-4">
                                            <ZoomIn className="w-8 h-8 text-white mb-2 drop-shadow-lg" />
                                            {img.title && (
                                                <span className="text-white text-xs font-bold text-center leading-tight">{img.title}</span>
                                            )}
                                        </div>

                                        {/* Category badge */}
                                        {img.category && (
                                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white/80 px-2 py-0.5 rounded-full">
                                                    {img.category.replace("_", " ")}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIdx !== null && currentImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={closeLightbox}
                    >
                        {/* Close button */}
                        <button
                            onClick={closeLightbox}
                            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Counter */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm z-10">
                            {lightboxIdx + 1} / {filtered.length}
                        </div>

                        {/* Prev / Next */}
                        <button
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                            className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); next(); }}
                            className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Image */}
                        <motion.div
                            key={lightboxIdx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="relative max-w-4xl max-h-[80vh] w-full h-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={getMediaUrl(currentImage.src || "")}
                                alt={currentImage.title || "Gallery image"}
                                fill
                                className="object-contain"
                                onError={(e) => { e.currentTarget.src = "/images/gokidsplay/unnamed.webp"; }}
                            />
                        </motion.div>

                        {/* Caption */}
                        {currentImage.title && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm font-semibold bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
                                {currentImage.title}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
