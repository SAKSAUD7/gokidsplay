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

// Homepage promotions slider (Website Content → Home Page). Dates are "YYYY-MM-DD" or null.
export async function createBanner(data: {
    title: string;
    imageUrl: string;
    link?: string;
    active: boolean;
    order: number;
    startDate?: string | null;
    endDate?: string | null;
}) {
    await requirePermission('cms', 'write');

    const payload = {
        title: data.title,
        image_url: data.imageUrl,
        link: data.link || null,
        active: data.active,
        order: data.order,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
    };

    const res = await fetchAPI("/cms/banners/", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false, error: await apiError(res) };

    const banner = await res.json();

    await logActivity({
        action: 'CREATE',
        entity: 'BANNER',
        entityId: banner.id.toString(),
        details: { after: banner }
    });

    revalidatePromotions();
    return { success: true, banner: transformCmsItem(banner) };
}

export async function updateBanner(id: string, data: {
    title?: string;
    imageUrl?: string;
    link?: string | null;
    active?: boolean;
    order?: number;
    startDate?: string | null;
    endDate?: string | null;
}) {
    await requirePermission('cms', 'write');

    const { imageUrl, startDate, endDate, ...rest } = data;
    const payload: any = { ...rest };
    if (imageUrl) payload.image_url = imageUrl;
    if (startDate !== undefined) payload.start_date = startDate || null;
    if (endDate !== undefined) payload.end_date = endDate || null;
    if (data.link !== undefined) payload.link = data.link || null;

    const res = await fetchAPI(`/cms/banners/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false, error: await apiError(res) };

    await logActivity({
        action: 'UPDATE',
        entity: 'BANNER',
        entityId: id,
        details: { after: data }
    });

    revalidatePromotions();
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

    revalidatePromotions();
    return { success: true };
}

function revalidatePromotions() {
    revalidatePath('/');                // the homepage slider
    revalidatePath('/admin/cms/home');
    revalidatePath('/admin/cms/promotions');
}

/** The API's first field error as one readable line. */
async function apiError(res: Response | null) {
    const body = await res?.json().catch(() => null);
    const first = body && Object.entries(body)[0];
    return first ? String(Array.isArray(first[1]) ? first[1][0] : first[1]) : "Could not save. Please try again.";
}

