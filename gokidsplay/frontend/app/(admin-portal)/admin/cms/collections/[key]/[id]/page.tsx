import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { getManagedCollection } from "@/lib/cms/collections";
import { getManagedItem } from "@/app/actions/managed-collections";
import { CMSBackLink } from "@/components/admin/cms/CMSBackLink";
import ManagedItemForm from "./ManagedItemForm";

export const dynamic = "force-dynamic";

export default async function ManagedItemPage({ params }: { params: { key: string; id: string } }) {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const collection = getManagedCollection(params.key);
    if (!collection) notFound();

    const isNew = params.id === "new";
    const item = isNew ? null : await getManagedItem(collection.key, params.id);
    if (!isNew && !item) notFound();

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <CMSBackLink href={`/admin/cms/collections/${collection.key}`} label={`Back to ${collection.label}`} />
            <h1 className="text-2xl font-bold text-slate-900 mb-6">
                {isNew ? `New ${collection.schema.name}` : `Edit ${collection.schema.name}`}
            </h1>
            <ManagedItemForm collectionKey={collection.key} id={isNew ? undefined : params.id} initialData={item ?? undefined} />
        </div>
    );
}
