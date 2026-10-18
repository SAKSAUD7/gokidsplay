import React from 'react';
import { getPricingPlans } from '@/app/actions/pricing-plans';
import { getPageSections } from '@/app/actions/page-sections';
import { getPartyPackages } from '@/app/actions/party-packages';
import { PricingPlansManager } from '@/components/admin/cms/pricing/PricingPlansManager';
import { PartyPackagesManager } from '@/components/admin/cms/pricing/PartyPackagesManager';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';
import { PageTextLink } from '@/components/admin/cms/PageTextLink';


export default async function PricingAdminPage() {
    // Fetch all data in parallel: Page Sections, Pricing Plans, Party Packages
    const [sections, plans, partyPackages] = await Promise.all([
        getPageSections('pricing'),
        getPricingPlans(),
        getPartyPackages(),
    ]) as [any[], any[], any[]];

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
                    <PageTextLink pageKey="pricing" />
                </section>

                {/* Session Pricing */}
                <section>
                    <PricingPlansManager items={plans} />
                </section>

                {/* Party Packages */}
                <section>
                    <PartyPackagesManager items={partyPackages} />
                </section>
            </div>
        </div>
    );
}

