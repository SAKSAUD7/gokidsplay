import React from 'react';
import { getMenuSections, deleteMenuSection } from '@/app/actions/menu-sections';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function MenuSectionsPage() {
    const items = await getMenuSections();

    return (
        <CollectionList
            title="Menu Sections"
            description="Manage food and drink menu sections"
            items={items}
            schema={schemas.menu_section}
            basePath="/admin/cms/menu-sections"
            onDelete={deleteMenuSection}
        />
    );
}

