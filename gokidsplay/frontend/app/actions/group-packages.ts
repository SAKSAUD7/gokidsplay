"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";
import { logActivity } from "../lib/audit-log";
import { revalidatePath } from "next/cache";
import { transformCmsItem } from "../lib/transformers";

export async function getGroupPackages() {
    const res = await fetchAPI("/cms/group-packages/", { next: { revalidate: 60 } });
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function getGroupPackage(id: string) {
    const res = await fetchAPI(`/cms/group-packages/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformCmsItem(data);
}

export async function createGroupPackage(data: any) {
    await requirePermission('cms', 'write');

    const res = await fetchAPI("/cms/group-packages/", {
        method: "POST",
        body: JSON.stringify(data)
    });

    if (!res || !res.ok) return { success: false };

    const item = await res.json();

    await logActivity({
        action: 'CREATE',
        entity: 'GROUP_PACKAGE',
        entityId: item.id.toString(),
        details: { after: item }
    });

    revalidatePath('/admin/cms/group-packages');
    return { success: true, item: transformCmsItem(item) };
}

export async function updateGroupPackage(id: string, data: any) {
    await requirePermission('cms', 'write');

    const res = await fetchAPI(`/cms/group-packages/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'UPDATE',
        entity: 'GROUP_PACKAGE',
        entityId: id,
        details: { after: data }
    });

    revalidatePath('/admin/cms/group-packages');
    return { success: true };
}

export async function deleteGroupPackage(id: string) {
    await requirePermission('cms', 'delete');

    const res = await fetchAPI(`/cms/group-packages/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'DELETE',
        entity: 'GROUP_PACKAGE',
        entityId: id
    });

    revalidatePath('/admin/cms/group-packages');
    return { success: true };
}
