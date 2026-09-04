import React from 'react';
import { getInstagramReels, deleteInstagramReel } from '@/app/actions/instagram-reels';
import { CollectionList } from "@/components/admin/cms/CollectionList";
import { schemas } from "@/lib/cms/schema";

export default async function InstagramReelsPage() {
    const items = await getInstagramReels();

    return (
        <CollectionList
            title="Instagram Reels"
            description="Manage Instagram reels feed"
            items={items}
            schema={schemas.instagram_reel}
            basePath="/admin/cms/instagram-reels"
            onDelete={deleteInstagramReel}
        />
    );
}

