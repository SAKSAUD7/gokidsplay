import React from 'react';
import { getMetadata } from '@/seo/seo.config';
import { getGroupPackages } from '@/app/actions/group-packages';
import { getGroupBenefits } from '@/app/actions/group-benefits';
import { getPageSections } from '@/app/actions/page-sections';
import GroupsContent from './components/GroupsContent';

export const metadata = getMetadata(
    'Group Bookings | Go Kids Play Coventry',
    'Book Go Kids Play for your school, corporate team, or large group. Exclusive group rates, dedicated hosts, and unforgettable fun for everyone. Get a custom quote today.'
);

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
    const [packages, benefits, pageSections] = await Promise.all([
        getGroupPackages(),
        getGroupBenefits(),
        getPageSections('groups')
    ]) as [any[], any[], any[]];

    const heroSection = pageSections.find((s: any) => s.section_key === 'hero');

    const hero = heroSection ? {
        title: heroSection.title,
        subtitle: heroSection.content,
        image: heroSection.image_url
    } : undefined;

    return (
        <GroupsContent
            packages={packages.filter((p: any) => p.active !== false)}
            benefits={benefits.filter((b: any) => b.active !== false)}
            hero={hero}
        />
    );
}

