import React from 'react';
import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import AboutContent from "./components/AboutContent";
import { getPublicPageContent } from "@/lib/public-api";
import { getStatCards } from "../../actions/stat-cards";
import { getTimelineItems } from "../../actions/timeline-items";
import { getValueItems } from "../../actions/value-items";
import { getFaqs } from "../../actions/faqs";
import { getInstagramReels } from "../../actions/instagram-reels";

export const metadata: Metadata = getMetadata(
    "About Us",
    "Learn about Go Kids Play Coventry — our story, our team, and our mission to create the most fun indoor play centre in the West Midlands."
);

export default async function AboutPage() {
    const [
        content,
        stats,
        timeline,
        values,
        faqs,
        reels
    ] = await Promise.all([
        getPublicPageContent('about'),
        getStatCards('about'),
        getTimelineItems(),
        getValueItems(),
        getFaqs(),
        getInstagramReels()
    ]) as [Awaited<ReturnType<typeof getPublicPageContent>>, any[], any[], any[], any[], any[]];

    // Filter active items if they have an active flag
    const activeValues = values.filter((v: any) => !v.hasOwnProperty('active') || v.active);
    const activeTimeline = timeline.filter((t: any) => !t.hasOwnProperty('active') || t.active); // Sort by year maybe?
    const activeFaqs = faqs.filter((f: any) => !f.hasOwnProperty('active') || f.active);

    return (
        <AboutContent
                values={activeValues}
                stats={stats}
                timeline={activeTimeline}
                faqs={activeFaqs}
                reels={reels.filter((r: any) => r.active)}
                content={content}
            />
    );
}
