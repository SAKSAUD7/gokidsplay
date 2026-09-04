import React from 'react';
import { getContactInfos, deleteContactInfo } from '@/app/actions/contact-info';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function ContactInfoPage() {
    const items = await getContactInfos();

    return (
        <CollectionList
            title="Contact Info"
            description="Manage site-wide contact information"
            items={items}
            schema={schemas.contact_info}
            basePath="/admin/cms/contact-info"
            onDelete={deleteContactInfo}
        />
    );
}

