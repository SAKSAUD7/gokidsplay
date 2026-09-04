import React from 'react';
import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import HomeContent from "./components/HomeContent";
import {
    getPublicBanners,
    getPublicActivities,
    getPublicGallery,
    getPublicPageSections,
    getPublicInstagramReels,
    getPublicStatCards,
    getGlobalSettings
} from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Go Kids Play | Indoor Play Centre Coventry",
    "Coventry's most exciting indoor play centre — Soft Play, Laser Arena, Go Karts, Inflatable Park & Kids Birthday Parties. Book online today!",
    true
);

export default async function Home() {
    // Fetch all data in parallel using public APIs
    const [
        banners,
        activities,
        gallery,
        sections,
        reels,
        statCards,
        settings
    ] = await Promise.all([
        getPublicBanners(),
        getPublicActivities(),
        getPublicGallery(),
        getPublicPageSections('home'),
        getPublicInstagramReels(),
        getPublicStatCards('home'),
        getGlobalSettings()
    ]);

    // Extract page sections
    const heroSection = sections.find((s: any) => s.section_key === 'hero');
    const aboutSection = sections.find((s: any) => s.section_key === 'about');

    // Transform stats
    const stats = statCards.length > 0 ? statCards.map((s: any) => ({
        id: s.id,
        value: s.value,
        label: s.label,
        icon: s.icon || 'Zap'
    })) : [
        { id: "size", value: "20,000+", label: "Sq Ft of Fun", icon: "Zap" },
        { id: "visitors", value: "5,000+", label: "Happy Visitors", icon: "Users" },
        { id: "attractions", value: `${activities.length}+`, label: "Attractions", icon: "Trophy" },
        { id: "safety", value: "100%", label: "Safe & Secure", icon: "Shield" },
    ];

    // Transform gallery
    const galleryItems = gallery
        .filter((g: any) => g.active && g.category !== 'parties_carousel')
        .slice(0, 8)
        .map((g: any) => ({
            id: g.id,
            src: g.image_url || '/images/hero-background.jpg',
            title: g.title || '',
            desc: g.category || ''
        }));

    // Prepare data for HomeContent
    const heroData = heroSection ? {
        title: heroSection.title,
        subtitle: heroSection.content,
        image: heroSection.image_url
    } : undefined;

    const aboutData = aboutSection ? {
        title: aboutSection.title,
        content: aboutSection.content,
        image: aboutSection.image_url
    } : undefined;

    return (
        <HomeContent
                stats={stats}
                gallery={galleryItems}
                banners={banners.filter((b: any) => b.active)}
                reels={reels.filter((r: any) => r.active)}
                settings={settings}
                activities={activities.filter((a: any) => a.active)}
                hero={heroData}
                about={aboutData}
            />
    );
}
