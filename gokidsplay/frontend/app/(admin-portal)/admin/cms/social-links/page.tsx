import React from 'react';
import { getSocialLinks, deleteSocialLink } from '@/app/actions/social-links';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function SocialLinksPage() {
    const items = await getSocialLinks();

    return (
        <CollectionList
            title="Social Links"
            description="Manage your social media profile links"
            items={items}
            schema={schemas.social_link}
            basePath="/admin/cms/social-links"
            onDelete={deleteSocialLink}
        />
    );
}

