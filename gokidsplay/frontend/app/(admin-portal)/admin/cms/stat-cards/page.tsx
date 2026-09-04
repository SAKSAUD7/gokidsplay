import React from 'react';
import { getStatCards, deleteStatCard } from '@/app/actions/stat-cards';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function StatCardsPage() {
    const items = await getStatCards();

    return (
        <CollectionList
            title="Stat Cards"
            description="Manage homepage statistics cards"
            items={items}
            schema={schemas.stat_card}
            basePath="/admin/cms/stat-cards"
            onDelete={deleteStatCard}
        />
    );
}

