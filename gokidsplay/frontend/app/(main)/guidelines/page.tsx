import React from 'react';
import GuidelinesContent from "./components/GuidelinesContent";
import { getMetadata } from "@/seo/seo.config";
import { getPublicFaqs, getPublicPageContent } from "@/lib/public-api";

export const metadata = getMetadata(
    "Park Guidelines & Safety | Go Kids Play Coventry",
    "Read the Go Kids Play Coventry safety guidelines before visiting. Rules for all attractions including Soft Play, Laser Arena, Go Karts, and the Inflatable Park to keep everyone safe.",
    true
);


export default async function GuidelinesPage() {
    const legalSlugs = ['terms', 'privacy', 'disclaimer', 'cookies', 'rights', 'security'];
    const [content, faqs, ...legalContent] = await Promise.all([
        getPublicPageContent('guidelines'),
        getPublicFaqs(),
        ...legalSlugs.map((slug) => getPublicPageContent(`legal-${slug}`)),
    ]);
    const legal = Object.fromEntries(legalSlugs.map((slug, i) => [slug, legalContent[i]]));
    const sortedFaqs = [...faqs].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    return <GuidelinesContent content={content} legal={legal} faqs={sortedFaqs} />;
}
