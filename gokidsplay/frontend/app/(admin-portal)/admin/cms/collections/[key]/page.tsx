import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { getManagedCollection } from "@/lib/cms/collections";
import { getManagedItems } from "@/app/actions/managed-collections";
import ManagedCollectionList from "./ManagedCollectionList";

export const dynamic = "force-dynamic";

export default async function ManagedCollectionPage({ params }: { params: { key: string } }) {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const collection = getManagedCollection(params.key);
    if (!collection) notFound();

    const items = await getManagedItems(collection.key);

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <ManagedCollectionList collectionKey={collection.key} items={items} />
        </div>
    );
}
