import React from 'react';
import { getGalleryItems, deleteGalleryItem } from '@/app/actions/gallery';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function GalleryPage() {
    const items = await getGalleryItems();

    return (
        <CollectionList
            title="Gallery"
            description="Manage photo gallery items"
            items={items}
            schema={schemas.gallery_item}
            basePath="/admin/cms/gallery"
            onDelete={deleteGalleryItem}
        />
    );
}

