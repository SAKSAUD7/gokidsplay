"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";
import { logActivity } from "../lib/audit-log";
import { revalidatePath } from "next/cache";
import { transformCmsItem } from "../lib/transformers";

export async function getPageSections(page: string) {
    // Public access allowed
    if (!page) return []; // Fail safe or throw error
    const endpoint = `/cms/page-sections/?page=${page}`;
    const res = await fetchAPI(endpoint);
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function getPageSection(id: string) {
    // Public access allowed
    const res = await fetchAPI(`/cms/page-sections/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformCmsItem(data);
}

export async function createPageSection(data: any) {
    try {
        await requirePermission('cms', 'write');
    } catch (error: any) {
        console.error('Permission error:', error.message);
        return { success: false, error: error.message || 'Permission denied' };
    }

    const res = await fetchAPI("/cms/page-sections/", {
        method: "POST",
        body: JSON.stringify(data)
    });

    if (!res || !res.ok) {
        const errorText = res ? await res.text().catch(() => 'Unknown error') : 'No response';
        console.error('API error:', errorText);
        return { success: false, error: `Failed to create: ${errorText}` };
    }

    const item = await res.json();

    await logActivity({
        action: 'CREATE',
        entity: 'PAGE_SECTION',
        entityId: item.id.toString(),
        details: { after: item }
    });

    // Revalidate all public-facing pages that consume page sections
    revalidatePath('/admin/cms/page-sections');
    revalidatePath('/pricing');
    revalidatePath('/');
    revalidatePath('/parties');
    revalidatePath('/attractions');
    revalidatePath('/contact');
    revalidatePath('/guidelines');
    return { success: true, item: transformCmsItem(item) };
}

export async function updatePageSection(id: string, data: any) {
    try {
        await requirePermission('cms', 'write');
    } catch (error: any) {
        console.error('Permission error:', error.message);
        return { success: false, error: error.message || 'Permission denied' };
    }

    const res = await fetchAPI(`/cms/page-sections/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

    if (!res || !res.ok) {
        const errorText = res ? await res.text().catch(() => 'Unknown error') : 'No response';
        console.error('API error:', errorText);
        return { success: false, error: `Failed to update: ${errorText}` };
    }

    const item = await res.json();

    await logActivity({
        action: 'UPDATE',
        entity: 'PAGE_SECTION',
        entityId: id,
        details: { after: item }
    });

    // Revalidate all public-facing pages that consume page sections
    revalidatePath('/admin/cms/page-sections');
    revalidatePath('/pricing');
    revalidatePath('/');
    revalidatePath('/parties');
    revalidatePath('/attractions');
    revalidatePath('/contact');
    revalidatePath('/guidelines');
    return { success: true, item: transformCmsItem(item) };
}

export async function deletePageSection(id: string) {
    await requirePermission('cms', 'delete');

    const res = await fetchAPI(`/cms/page-sections/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'DELETE',
        entity: 'PAGE_SECTION',
        entityId: id
    });

    revalidatePath('/admin/cms/page-sections');
    return { success: true };
}
