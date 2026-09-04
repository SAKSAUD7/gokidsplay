"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";
import { logActivity } from "../lib/audit-log";
import { revalidatePath } from "next/cache";
import { transformCmsItem } from "../lib/transformers";

export async function getSocialLinks() {
    const res = await fetchAPI("/cms/social-links/", { next: { revalidate: 60 } });
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function getSocialLink(id: string) {
    const res = await fetchAPI(`/cms/social-links/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformCmsItem(data);
}

export async function createSocialLink(data: {
    platform: string;
    url: string;
    icon?: string;
    active: boolean;
    order: number;
}) {
    await requirePermission('cms', 'write');

    const res = await fetchAPI("/cms/social-links/", {
        method: "POST",
        body: JSON.stringify(data)
    });

    if (!res || !res.ok) return { success: false };

    const item = await res.json();

    await logActivity({
        action: 'CREATE',
        entity: 'SOCIAL_LINK',
        entityId: item.id.toString(),
        details: { after: item }
    });

    revalidatePath('/admin/social-links');
    return { success: true, item: transformCmsItem(item) };
}

export async function updateSocialLink(id: string, data: Partial<{
    platform?: string;
    url?: string;
    icon?: string;
    active?: boolean;
    order?: number;
}>) {
    await requirePermission('cms', 'write');

    const res = await fetchAPI(`/cms/social-links/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'UPDATE',
        entity: 'SOCIAL_LINK',
        entityId: id,
        details: { after: data }
    });

    revalidatePath('/admin/social-links');
    return { success: true };
}

export async function deleteSocialLink(id: string) {
    await requirePermission('cms', 'delete');

    const res = await fetchAPI(`/cms/social-links/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'DELETE',
        entity: 'SOCIAL_LINK',
        entityId: id
    });

    revalidatePath('/admin/social-links');
    return { success: true };
}
