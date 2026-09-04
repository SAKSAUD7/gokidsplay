import React from 'react';
import AttractionsContent from "./components/AttractionsContent";
import { getActivities } from "../../actions/activities";
import { getFacilityItems } from "../../actions/facility-items";
import { getPageSections } from "../../actions/page-sections";
import { getAttractionVideo } from "../../actions/attraction-video";
import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Ten Pin Bowling, Roller Skating & Arcade Games Leicester",
    "Enjoy ten pin bowling, Leicester's first roller skating rink, and the best arcade games at Go Kids Play Leicester! Play on top lanes, compete with friends, and experience the best entertainment in Leicester city centre.",
    true
);

export default async function AttractionsPage() {
    const [
        activitiesRaw,
        facilitiesRaw,
        pageSectionsRaw,
        videoData
    ] = await Promise.all([
        getActivities(),
        getFacilityItems(),
        getPageSections('attractions'),
        getAttractionVideo()
    ]) as [any[], any[], any[], any];

    // Transform activities to match Activity interface if needed, or pass as is if they match
    // Activity interface: { id, name, description, imageUrl, active, order }
    // CMS likely returns similar structure (snake_case or camelCase depending on API)
    // Assuming API returns snake_case, let's map it just in case, or pass through if 'any' handles it.
    // Ideally we should use TypeScript types.

    const activities = activitiesRaw
        .filter((a: any) => !a.hasOwnProperty('active') || a.active)
        .map((a: any) => ({
            id: a.id || a._id,
            name: a.name || a.title,
            description: a.description,
            imageUrl: a.image_url || a.image || a.imageUrl,
            active: a.active,
            order: a.order || 0,
            why_choose_us: a.why_choose_us,
            what_to_expect: a.what_to_expect,
            location_info: a.location_info,
            activity_faqs: a.activity_faqs
        }))
        .sort((a, b) => a.order - b.order);

    const facilities = facilitiesRaw
        .filter((f: any) => !f.hasOwnProperty('active') || f.active)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    const heroSection = pageSectionsRaw.find((s: any) => s.section_key === 'hero');
    const hero = heroSection ? {
        title: heroSection.title,
        subtitle: heroSection.content,
        image: heroSection.image_url
    } : undefined;

    return (
        <AttractionsContent
                activities={activities}
                facilities={facilities}
                hero={hero}
                videoData={videoData}
            />
    );
}
