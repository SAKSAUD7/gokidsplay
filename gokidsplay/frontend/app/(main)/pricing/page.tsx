import React from 'react';
import PricingContent from "./components/PricingContent";
import { getPricingPlans } from "../../actions/pricing-plans";
import { getSettings } from "../../actions/settings";
import { getPublicPageSections, getPublicPricingCarouselImages } from "@/lib/public-api";

import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Our Prices | Information",
    "Go Kids Play is Leicester's go-to destination for fun and entertainment, offering rollerskating, bowling, party bookings and more. CALL US: 07349110865.",
    true
);

export default async function Pricing() {
    const [
        plans,
        settings,
        sections,
        carouselImages
    ] = await Promise.all([
        getPricingPlans(),
        getSettings(),
        getPublicPageSections('pricing'),
        getPublicPricingCarouselImages()
    ]) as [any[], any, any[], any[]];

    const heroSection = sections.find((s: any) => s.section_key === 'hero');

    const hero = heroSection ? {
        title: heroSection.title,
        subtitle: heroSection.content || heroSection.subtitle, // support both fields
        image: heroSection.image_url
    } : undefined;

    return (
        <PricingContent
                plans={plans}
                settings={settings}
                hero={hero}
                carouselImages={carouselImages}
            />
    );
}
