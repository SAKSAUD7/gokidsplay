"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";
import { logActivity } from "../lib/audit-log";
import { revalidatePath } from "next/cache";
import { transformCmsItem } from "../lib/transformers";

export async function getGalleryItems(): Promise<any[]> {
    // Public access allowed
    const res = await fetchAPI("/cms/gallery/");
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function getGalleryItem(id: string) {
    // Public access allowed
    const res = await fetchAPI(`/cms/gallery/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformCmsItem(data);
}

export async function createGalleryItem(data: {
    title?: string;
    imageUrl: string;
    category?: string;
    active: boolean;
    order: number;
}) {
    await requirePermission('cms', 'write');

    const payload = {
        title: data.title,
        image_url: data.imageUrl,
        category: data.category,
        active: data.active,
        order: data.order
    };

    const res = await fetchAPI("/cms/gallery/", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false };

    const item = await res.json();

    await logActivity({
        action: 'CREATE',
        entity: 'GALLERY_ITEM',
        entityId: item.id.toString(),
        details: { after: item }
    });

    revalidatePath('/admin/gallery');
    revalidatePath('/admin/cms/home');
    revalidatePath('/admin/cms/parties');
    revalidatePath('/');
    return { success: true, item: transformCmsItem(item) };
}

export async function updateGalleryItem(id: string, data: any) {
    await requirePermission('cms', 'write');

    const payload: any = { ...data };
    if (data.imageUrl) {
        payload.image_url = data.imageUrl;
        delete payload.imageUrl;
    }

    const res = await fetchAPI(`/cms/gallery/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'UPDATE',
        entity: 'GALLERY_ITEM',
        entityId: id,
        details: { after: data }
    });

    revalidatePath('/admin/gallery');
    revalidatePath('/admin/cms/home');
    revalidatePath('/admin/cms/parties');
    revalidatePath('/');
    return { success: true };
}

export async function deleteGalleryItem(id: string) {
    await requirePermission('cms', 'delete');

    const res = await fetchAPI(`/cms/gallery/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'DELETE',
        entity: 'GALLERY_ITEM',
        entityId: id
    });

    revalidatePath('/admin/gallery');
    revalidatePath('/admin/cms/home');
    revalidatePath('/admin/cms/parties');
    revalidatePath('/');
    return { success: true };
}
