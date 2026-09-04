'use client';

import React, { useEffect, useState } from 'react';
import { getPageSections } from '@/app/actions/page-sections';
import { getStatCards } from '@/app/actions/stat-cards';
import { getTimelineItems } from '@/app/actions/timeline-items';
import { getValueItems } from '@/app/actions/value-items';
import { getFaqs } from '@/app/actions/faqs';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';
import { Loader2 } from 'lucide-react';
import { PageSectionEditor } from '@/app/(admin-portal)/admin/components/PageSectionEditor';

export default function AboutAdminPage() {
    const [loading, setLoading] = useState(true);
    const [heroSection, setHeroSection] = useState<any>(null);
    const [storySection, setStorySection] = useState<any>(null);
    const [stats, setStats] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [values, setValues] = useState<any[]>([]);
    const [faqs, setFaqs] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [sections, statsData, timelineData, valuesData, faqsData] = await Promise.all([
                getPageSections('about'),
                getStatCards('about'),
                getTimelineItems(),
                getValueItems(),
                getFaqs()
            ]) as [any[], any[], any[], any[], any[]];

            setHeroSection(sections.find((s: any) => s.section_key === 'hero'));
            setStorySection(sections.find((s: any) => s.section_key === 'story'));
            setStats(statsData);
            setTimeline(timelineData);
            setValues(valuesData);
            setFaqs(faqsData);
        } catch (error) {
            console.error('Failed to load about page data:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-12 max-w-5xl mx-auto pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">About Page Editing</h1>
                <p className="text-slate-500">Manage content for the about us page</p>
            </div>

            {/* Hero Section */}
            <section>
                <PageSectionEditor
                    page="about"
                    sectionKey="hero"
                    sectionTitle="Hero Section"
                    initialData={heroSection}
                    hideImage={true}
                />
            </section>

            {/* Story Section */}
            <section>
                <PageSectionEditor
                    page="about"
                    sectionKey="story"
                    sectionTitle="Our Story Section"
                    initialData={storySection}
                />
            </section>

            {/* Stats */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">Statistics</h2>
                </div>
                <CollectionList
                    schema={schemas.stat_card}
                    items={stats}
                    basePath="/admin/cms/stat-cards"
                    titleField="label"
                    subtitleField="value"
                    showBackButton={false}
                />
            </section>

            {/* Timeline */}
            <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Timeline</h2>
                <CollectionList
                    schema={schemas.timeline_item}
                    items={timeline}
                    basePath="/admin/cms/timeline-items"
                    titleField="year"
                    subtitleField="title"
                    showBackButton={false}
                />
            </section>

            {/* Values */}
            <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Core Values</h2>
                <CollectionList
                    schema={schemas.value_item}
                    items={values}
                    basePath="/admin/cms/value-items"
                    titleField="title"
                    subtitleField="description"
                    showBackButton={false}
                />
            </section>

            {/* FAQs */}
            <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">FAQs</h2>
                <CollectionList
                    schema={schemas.faq}
                    items={faqs}
                    basePath="/admin/cms/faqs"
                    titleField="question"
                    subtitleField="answer"
                    showBackButton={false}
                />
            </section>
        </div>
    );
}
