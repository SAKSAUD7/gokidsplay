import React from 'react';
import { getTimingCards, deleteTimingCard } from '@/app/actions/timing-cards';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function TimingCardsPage() {
    const items = await getTimingCards() as any[];

    return (
        <CollectionList
            title="Timing Cards"
            description="Manage opening hours / timing cards shown on all pages"
            items={items}
            schema={schemas.timing_card}
            basePath="/admin/cms/timing-cards"
            onDelete={deleteTimingCard}
        />
    );
}
