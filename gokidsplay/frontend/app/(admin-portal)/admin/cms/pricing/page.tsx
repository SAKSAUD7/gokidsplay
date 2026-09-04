import React from 'react';
import { getPricingPlans } from '@/app/actions/pricing-plans';
import { getPageSections } from '@/app/actions/page-sections';
import { getPartyPackages } from '@/app/actions/party-packages';
import { getGroupPackages } from '@/app/actions/group-packages';
import { PricingPlansManager } from '@/components/admin/cms/pricing/PricingPlansManager';
import { PartyPackagesManager } from '@/components/admin/cms/pricing/PartyPackagesManager';
import { GroupPackagesManager } from '@/components/admin/cms/pricing/GroupPackagesManager';
import PricingCarouselManager from '@/components/admin/cms/pricing/PricingCarouselManager';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';

import { PageSectionEditor } from '@/app/(admin-portal)/admin/components/PageSectionEditor';

export default async function PricingAdminPage() {
    // Fetch all data in parallel: Page Sections, Pricing Plans, Party Packages, Group Packages
    const [sections, plans, partyPackages, groupPackages] = await Promise.all([
        getPageSections('pricing'),
        getPricingPlans(),
        getPartyPackages(),
        getGroupPackages()
    ]) as [any[], any[], any[], any[]];

    const heroSection = sections.find((s: any) => s.section_key === 'hero');

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <CMSBackLink />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pricing Page Content</h1>
                    <p className="text-slate-500">Manage Hero section and pricing packages</p>
                </div>
            </div>

            <div className="space-y-12">
                {/* Pricing Hero Section */}
                <section>
                    <PageSectionEditor
                        page="pricing"
                        sectionKey="hero"
                        sectionTitle="Pricing Page Hero"
                        initialData={heroSection}
                    />
                </section>

                {/* Carousel Section */}
                <section>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 mb-8">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Image Carousel</h2>
                        <p className="text-sm text-slate-500 mb-6">Manage images displayed below the hero section</p>
                        <PricingCarouselManager />
                    </div>
                </section>

                {/* Session Pricing */}
                <section>
                    <PricingPlansManager items={plans} />
                </section>

                {/* Party Packages */}
                <section>
                    <PartyPackagesManager items={partyPackages} />
                </section>

                {/* Group Packages Manager */}
                <section>
                    <GroupPackagesManager items={groupPackages} />
                </section>
            </div>
        </div>
    );
}

