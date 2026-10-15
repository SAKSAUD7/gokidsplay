"use server";

import { fetchAPI } from "../lib/server-api";
import { logActivity } from "../lib/audit-log";
import { requirePermission } from "../lib/admin-auth";
import { revalidatePath } from "next/cache";
import { transformCmsItem } from "../lib/transformers";

export async function getInstagramReels() {
    const res = await fetchAPI("/cms/instagram-reels/", { next: { revalidate: 60 } });
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function getInstagramReel(id: string) {
    const res = await fetchAPI(`/cms/instagram-reels/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformCmsItem(data);
}

export async function createInstagramReel(data: {
    title: string;
    reelUrl: string;
    thumbnailUrl: string;
    active: boolean;
    order: number;
}) {
    await requirePermission('cms', 'write');

    // Fetch thumbnail from Instagram oEmbed if reelUrl is provided
    let derivedThumbnail = data.thumbnailUrl;
    if (data.reelUrl && (!derivedThumbnail || derivedThumbnail.trim() === '')) {
        try {
            console.log(`[InstagramReel] Fetching oEmbed for: ${data.reelUrl}`);
            const oembedRes = await fetch(`https://www.instagram.com/oembed/?url=${encodeURIComponent(data.reelUrl)}`);
            if (oembedRes.ok) {
                const oembedData = await oembedRes.json();
                console.log(`[InstagramReel] oEmbed response:`, oembedData);
                if (oembedData.thumbnail_url) {
                    derivedThumbnail = oembedData.thumbnail_url;
                    console.log(`[InstagramReel] Found thumbnail: ${derivedThumbnail}`);
                }
            } else {
                console.warn(`[InstagramReel] oEmbed fetch failed: ${oembedRes.status}`);
                // Fallback to media URL pattern which redirects to image
                // Ensure URL ends effectively and append /media/?size=l
                const cleanUrl = data.reelUrl.split('?')[0].replace(/\/$/, '');
                derivedThumbnail = `${cleanUrl}/media/?size=l`;
                console.log(`[InstagramReel] Using fallback thumbnail: ${derivedThumbnail}`);
            }
        } catch (error) {
            console.error('[InstagramReel] oEmbed error details:', error);
            // Fallback on error too
            const cleanUrl = data.reelUrl.split('?')[0].replace(/\/$/, '');
            derivedThumbnail = `${cleanUrl}/media/?size=l`;
        }
    }

    const payload = {
        title: data.title,
        reel_url: data.reelUrl,
        thumbnail_url: derivedThumbnail || "",
        active: data.active,
        order: data.order
    };

    const res = await fetchAPI("/cms/instagram-reels/", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) {
        const errorText = await res?.text().catch(() => 'Unknown error');
        console.error('[InstagramReel] Create failed:', errorText);
        return { success: false, error: errorText || 'Failed to create reel' };
    }

    const item = await res.json();

    await logActivity({
        action: 'CREATE',
        entity: 'INSTAGRAM_REEL',
        entityId: item.id.toString(),
        details: { after: item }
    });

    revalidatePath('/admin/instagram-reels');
    revalidatePath('/', 'layout');
    return { success: true, item: transformCmsItem(item) };
}

export async function updateInstagramReel(id: string, data: Partial<{
    title?: string;
    reelUrl?: string;
    thumbnailUrl?: string;
    active?: boolean;
    order?: number;
}>) {
    await requirePermission('cms', 'write');

    const payload: any = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.reelUrl !== undefined) payload.reel_url = data.reelUrl;
    if (data.thumbnailUrl !== undefined) payload.thumbnail_url = data.thumbnailUrl;
    if (data.active !== undefined) payload.active = data.active;
    if (data.order !== undefined) payload.order = data.order;

    // If updating URL but no thumbnail provided, try to fetch it
    if (data.reelUrl && !data.thumbnailUrl) {
        try {
            console.log(`[InstagramReel] Fetching oEmbed for update: ${data.reelUrl}`);
            const oembedRes = await fetch(`https://www.instagram.com/oembed/?url=${encodeURIComponent(data.reelUrl)}`);
            if (oembedRes.ok) {
                const oembedData = await oembedRes.json();
                if (oembedData.thumbnail_url) {
                    payload.thumbnail_url = oembedData.thumbnail_url;
                    console.log(`[InstagramReel] Found new thumbnail: ${payload.thumbnail_url}`);
                }
            }
        } catch (error) {
            console.error('[InstagramReel] oEmbed error:', error);
        }
    }

    console.log('[InstagramReel] Updating reel:', id, 'Payload:', JSON.stringify(payload));

    const res = await fetchAPI(`/cms/instagram-reels/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'UPDATE',
        entity: 'INSTAGRAM_REEL',
        entityId: id,
        details: { after: data }
    });

    revalidatePath('/admin/instagram-reels');
    revalidatePath('/', 'layout'); // Force refresh of main site cache
    return { success: true };
}

export async function deleteInstagramReel(id: string) {
    await requirePermission('cms', 'delete');

    const res = await fetchAPI(`/cms/instagram-reels/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'DELETE',
        entity: 'INSTAGRAM_REEL',
        entityId: id
    });

    revalidatePath('/admin/instagram-reels');
    return { success: true };
}
