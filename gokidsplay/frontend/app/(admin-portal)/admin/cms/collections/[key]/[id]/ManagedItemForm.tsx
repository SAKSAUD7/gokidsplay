"use client";

import { CMSForm } from "@/components/admin/cms/CMSForm";
import { getManagedCollection } from "@/lib/cms/collections";
import { saveManagedItem } from "@/app/actions/managed-collections";

export default function ManagedItemForm({
    collectionKey,
    id,
    initialData,
}: {
    collectionKey: string;
    id?: string;
    initialData?: any;
}) {
    const collection = getManagedCollection(collectionKey)!;
    const defaults = Object.fromEntries(
        collection.schema.fields.filter((f) => f.defaultValue !== undefined).map((f) => [f.name, f.defaultValue])
    );

    return (
        <CMSForm
            schema={collection.schema}
            initialData={initialData ?? defaults}
            submitLabel={id ? "Save Changes" : `Create ${collection.schema.name}`}
            backUrl={`/admin/cms/collections/${collection.key}`}
            onSubmit={async (data) => {
                const result = await saveManagedItem(collection.key, data, id);
                return { success: result.success, error: result.success ? undefined : result.error };
            }}
        />
    );
}
