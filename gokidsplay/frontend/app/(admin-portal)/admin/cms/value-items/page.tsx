import React from 'react';
import { getValueItems, deleteValueItem } from '@/app/actions/value-items';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function ValueItemsPage() {
    const items = await getValueItems() as any[];

    return (
        <CollectionList
            title="Value Items"
            description="Manage company core values"
            items={items}
            schema={schemas.value_item}
            basePath="/admin/cms/value-items"
            onDelete={deleteValueItem}
        />
    );
}

