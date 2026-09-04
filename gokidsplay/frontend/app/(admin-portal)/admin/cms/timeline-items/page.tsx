import React from 'react';
import { getTimelineItems, deleteTimelineItem } from '@/app/actions/timeline-items';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function TimelineItemsPage() {
    const items = await getTimelineItems();

    return (
        <CollectionList
            title="Timeline Items"
            description="Manage company history timeline"
            items={items}
            schema={schemas.timeline_item}
            basePath="/admin/cms/timeline-items"
            onDelete={deleteTimelineItem}
        />
    );
}

