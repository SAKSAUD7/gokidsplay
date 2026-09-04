import React from 'react';
import { getFacilityItems, deleteFacilityItem } from '@/app/actions/facility-items';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function FacilityItemsPage() {
    const items = await getFacilityItems();

    return (
        <CollectionList
            title="Facility Items"
            description="Manage park facilities"
            items={items}
            schema={schemas.facility_item}
            basePath="/admin/cms/facility-items"
            onDelete={deleteFacilityItem}
        />
    );
}

