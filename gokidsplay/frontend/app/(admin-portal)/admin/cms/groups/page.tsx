import React from 'react';
import { getPageSections } from '@/app/actions/page-sections';
import { getGroupPackages } from '@/app/actions/group-packages';
import { getGroupBenefits } from '@/app/actions/group-benefits';
import { HeroEditor } from '@/components/admin/cms/home/HeroEditor';
import { GroupPackagesManager } from '@/components/admin/cms/groups/GroupPackagesManager';
import { GroupBenefitsManager } from '@/components/admin/cms/groups/GroupBenefitsManager';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';

export default async function GroupsAdminPage() {
    // Fetch all data in parallel
    const [sections, packages, benefits] = await Promise.all([
        getPageSections('groups'),
        getGroupPackages(),
        getGroupBenefits()
    ]) as [any[], any[], any[]];

    // Find hero section
    const heroSection = sections.find((s: any) => s.section_key === 'hero');

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <CMSBackLink />
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Groups Page Editing</h1>
                <p className="text-slate-500">Manage group bookings page content</p>
            </div>

            <div className="grid gap-8">
                {/* Hero Section Editor */}
                <section>
                    <HeroEditor section={heroSection} pageSlug="groups" />
                </section>

                {/* Group Benefits Manager */}
                <section>
                    <GroupBenefitsManager items={benefits} />
                </section>

                {/* Group Packages Manager */}
                <section>
                    <GroupPackagesManager items={packages} />
                </section>
            </div>
        </div>
    );
}
