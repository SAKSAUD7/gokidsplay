"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";
import { logActivity } from "../lib/audit-log";
import { revalidatePath } from "next/cache";
import { transformCmsItem } from "../lib/transformers";

export async function getPages() {
    // Public access allowed
    const res = await fetchAPI("/cms/pages/");
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function getPage(slug: string) {
    // Public access allowed
    const res = await fetchAPI(`/cms/pages/${slug}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformCmsItem(data);
}

export async function updatePage(slug: string, data: any) {
    await requirePermission('cms', 'write');

    const res = await fetchAPI(`/cms/pages/${slug}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'UPDATE',
        entity: 'PAGE',
        entityId: slug,
        details: { after: data }
    });

    revalidatePath('/admin/cms');
    revalidatePath(`/admin/cms/${slug}`);
    return { success: true };
}
