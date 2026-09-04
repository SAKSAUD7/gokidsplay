import React from 'react';
import { getPageSections } from '@/app/actions/page-sections';
import { getActivities } from '@/app/actions/activities';
import { getFacilityItems } from '@/app/actions/facility-items';
import { HeroEditor } from '@/components/admin/cms/home/HeroEditor';
import { AttractionsManager } from '@/components/admin/cms/attractions/AttractionsManager';
import { FacilitiesManager } from '@/components/admin/cms/attractions/FacilitiesManager';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';
import { getAttractionVideo } from '@/app/actions/attraction-video';
import { AttractionVideoManager } from '@/components/admin/cms/attractions/AttractionVideoManager';

export default async function AttractionsAdminPage() {
    // Fetch all data in parallel
    const [sections, activities, facilities, videoData] = await Promise.all([
        getPageSections('attractions'),
        getActivities(),
        getFacilityItems(),
        getAttractionVideo()
    ]) as [any[], any[], any[], any];

    // Find hero section
    const heroSection = sections.find((s: any) => s.section_key === 'hero');

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <CMSBackLink />
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Attractions Page Editing</h1>
                <p className="text-slate-500">Manage content for the attractions page</p>
            </div>

            <div className="grid gap-8">
                {/* Hero Section Editor */}
                <section>
                    <HeroEditor section={heroSection} pageSlug="attractions" />
                </section>

                {/* Attraction Video Manager */}
                <section>
                    <AttractionVideoManager initialData={videoData} />
                </section>

                {/* Attractions Manager */}
                <section>
                    <AttractionsManager items={activities} />
                </section>

                {/* Facilities Manager */}
                <section>
                    <FacilitiesManager items={facilities} />
                </section>
            </div>
        </div>
    );
}

