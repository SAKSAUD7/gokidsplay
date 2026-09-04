import React from 'react';
import { getFaqs } from '@/app/actions/faqs';
import FAQContent from './FAQContent';
import { getPageSections } from '@/app/actions/page-sections';
import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "FAQs | Frequently Asked Questions",
    "Go Kids Play is Leicester's go-to destination for fun and entertainment, offering rollerskating, bowling, party bookings and more.",
    true
);

export default async function FAQPage() {
    const [faqs, sections] = await Promise.all([
        getFaqs(),
        getPageSections('faq'),
    ]) as [any[], any[]];

    const activeFaqs = faqs
        .filter((f: any) => f.active !== false)
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    const heroSection = sections.find((s: any) => s.section_key === 'hero');
    const hero = heroSection ? {
        title: heroSection.title || 'Frequently Asked Questions',
        subtitle: heroSection.content || heroSection.subtitle || "Got questions? We've got answers!",
        image: heroSection.image_url || '/images/uploads/img-7.jpg',
    } : {
        title: 'Frequently Asked Questions',
        subtitle: "Got questions? We've got answers! Find everything you need to know about visiting Go Kids Play Leicester.",
        image: '/images/uploads/img-7.jpg',
    };

    // Group FAQs by category
    const grouped: Record<string, any[]> = {};
    for (const faq of activeFaqs) {
        const cat = faq.category || 'General';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(faq);
    }

    return (
        <FAQContent hero={hero} grouped={grouped} allFaqs={activeFaqs} />
    );
}
