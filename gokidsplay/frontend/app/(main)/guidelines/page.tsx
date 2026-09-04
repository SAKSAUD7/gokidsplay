import React from 'react';
import { getPageSections } from '@/app/actions/page-sections';
import { getGuidelineCategories } from '@/app/actions/guideline-categories';
import { getLegalDocuments } from '@/app/actions/legal-documents';
import { getFaqs } from '@/app/actions/faqs';
import GuidelinesContent from "./components/GuidelinesContent";
import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Roller Skating Guidelines | Information",
    "Go Kids Play is Leicester's go-to destination for fun and entertainment, offering rollerskating, bowling, party bookings and more.",
    true
);

export default async function GuidelinesPage() {
    // Fetch all data in parallel
    const [sections, categories, legalDocuments, faqs] = await Promise.all([
        getPageSections('guidelines'),
        getGuidelineCategories(),
        getLegalDocuments(),
        getFaqs()
    ]) as [any[], any[], any[], any[]];

    // Find hero section
    const heroSection = sections.find((s: any) => s.section_key === 'hero');

    const hero = heroSection ? {
        title: heroSection.title,
        subtitle: heroSection.content,
        image: heroSection.image_url
    } : undefined;

    // Filter active items
    const activeCategories = categories.filter(c => c.active !== false);
    const activeLegalDocs = legalDocuments.filter(d => d.active !== false);
    const activeFaqs = faqs.filter(f => f.active !== false);

    return (
        <GuidelinesContent
                hero={hero}
                categories={activeCategories}
                legalDocuments={activeLegalDocs}
                faqs={activeFaqs}
            />
    );
}
