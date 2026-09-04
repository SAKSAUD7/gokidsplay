"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";
import { logActivity } from "../lib/audit-log";
import { revalidatePath } from "next/cache";
import { transformCmsItem } from "../lib/transformers";

export async function getBanners(): Promise<any[]> {
    await requirePermission('cms', 'read');
    const res = await fetchAPI("/cms/banners/");
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function getBanner(id: string) {
    await requirePermission('cms', 'read');
    const res = await fetchAPI(`/cms/banners/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformCmsItem(data);
}

export async function createBanner(data: {
    title: string;
    imageUrl: string;
    link?: string;
    active: boolean;
    order: number;
}) {
    await requirePermission('cms', 'write');

    const payload = {
        title: data.title,
        image_url: data.imageUrl,
        link: data.link,
        active: data.active,
        order: data.order
    };

    const res = await fetchAPI("/cms/banners/", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false };

    const banner = await res.json();

    await logActivity({
        action: 'CREATE',
        entity: 'BANNER',
        entityId: banner.id.toString(),
        details: { after: banner }
    });

    revalidatePath('/admin/banners');
    return { success: true, banner: transformCmsItem(banner) };
}

export async function updateBanner(id: string, data: {
    title?: string;
    imageUrl?: string;
    link?: string;
    active?: boolean;
    order?: number;
}) {
    await requirePermission('cms', 'write');

    const payload: any = { ...data };
    if (data.imageUrl) {
        payload.image_url = data.imageUrl;
        delete payload.imageUrl;
    }

    const res = await fetchAPI(`/cms/banners/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'UPDATE',
        entity: 'BANNER',
        entityId: id,
        details: { after: data }
    });

    revalidatePath('/admin/banners');
    return { success: true };
}

export async function deleteBanner(id: string) {
    await requirePermission('cms', 'delete');

    const res = await fetchAPI(`/cms/banners/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'DELETE',
        entity: 'BANNER',
        entityId: id
    });

    revalidatePath('/admin/banners');
    return { success: true };
}
