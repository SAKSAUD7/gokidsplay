"use client";

import { CollectionList } from "@/components/admin/cms/CollectionList";
import { getManagedCollection } from "@/lib/cms/collections";
import { deleteManagedItem } from "@/app/actions/managed-collections";

export default function ManagedCollectionList({ collectionKey, items }: { collectionKey: string; items: any[] }) {
    const collection = getManagedCollection(collectionKey)!;
    return (
        <CollectionList
            title={collection.label}
            description={collection.description}
            items={items}
            schema={collection.schema}
            basePath={`/admin/cms/collections/${collection.key}`}
            onDelete={(id) => deleteManagedItem(collection.key, id)}
            titleField={collection.titleField}
            subtitleField={collection.subtitleField}
            imageField={collection.imageField}
        />
    );
}
