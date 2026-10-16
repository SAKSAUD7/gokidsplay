"use server";

import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

// Pricing Carousel Actions

export async function getPricingCarouselImages() {
    try {
        return await fetchAPI<any[]>(API_ENDPOINTS.cms.pricing_carousel_images);
    } catch (error) {
        console.error("Failed to fetch pricing carousel images:", error);
        return []; // Return empty array to prevent UI crash
    }
}

export async function updatePricingCarouselOrder(items: { id: number; order: number }[]) {
    // Assuming backend supports batch update or we do loop. 
    // Usually standard ModelViewSet doesn't support batch update on root.
    // For simplicity, we loop here since it's server-side and low volume.
    // Better: Helper endpoint on backend. But loop is fine for < 20 items.

    for (const item of items) {
        await putAPI(`${API_ENDPOINTS.cms.pricing_carousel_images}${item.id}/`, {
            order: item.order
        });
    }
    revalidatePath('/admin/cms/pricing');
}

export async function deletePricingCarouselImage(id: number) {
    await deleteAPI(`${API_ENDPOINTS.cms.pricing_carousel_images}${id}/`);
    revalidatePath('/admin/cms/pricing');
}



export async function createPricingCarouselImage(payload: any) {
    try {
        await postAPI(API_ENDPOINTS.cms.pricing_carousel_images, payload);
        revalidatePath('/admin/cms/pricing');
        return { success: true };
    } catch (error: any) {
        console.error("Create Record Error:", error);
        return { success: false, error: error.message || "Failed to create record" };
    }
}

// Free Entry Actions

export async function getFreeEntries() {
    try {
        // fetchAPI returns the parsed JSON (and throws on an error status)
        const data = await fetchAPI<any>(API_ENDPOINTS.cms.freeEntries);
        // Depending on DRF pagination, it might return an array or { results: [] }
        if (data && data.results) {
            return data.results;
        }
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Failed to fetch free entries:", error);
        return [];
    }
}

export async function createFreeEntry(payload: any) {
    try {
        const response = await postAPI(API_ENDPOINTS.cms.freeEntries, payload);
        revalidatePath('/admin/free-entries');
        return response;
    } catch (error: any) {
        console.error("Create Free Entry Error:", error);
        throw new Error(error.message || "Failed to create free entry");
    }
}

export async function updateFreeEntryStatus(id: number, status: string, notes?: string) {
    try {
        const payload: any = { status };
        if (notes !== undefined) {
            payload.notes = notes;
        }
        
        // PATCH only the changed fields; fetchAPI throws on an error status
        const updated = await fetchAPI<any>(`${API_ENDPOINTS.cms.freeEntries}${id}/`, {
            method: "PATCH",
            body: JSON.stringify(payload)
        });

        revalidatePath('/admin/free-entries');
        return updated;
    } catch (error: any) {
        console.error("Update Free Entry Status Error:", error);
        throw new Error(error.message || "Failed to update free entry status");
    }
}

export async function deleteFreeEntry(id: number) {
    try {
        await deleteAPI(`${API_ENDPOINTS.cms.freeEntries}${id}/`);
        revalidatePath('/admin/free-entries');
        return true;
    } catch (error: any) {
        console.error("Delete Free Entry Error:", error);
        throw new Error(error.message || "Failed to delete free entry");
    }
}

// ── Shop products ─────────────────────────────────────────────────────────

function shopAuthHeaders() {
    const token = cookies().get('admin_token')?.value;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
}

export async function getProducts() {
    try {
        const r = await fetch(`${API_URL}/shop/products/`, { headers: shopAuthHeaders(), cache: 'no-store' });
        if (!r.ok) return [];
        const data = await r.json();
        return Array.isArray(data) ? data : (data.results || []);
    } catch { return []; }
}

export async function getProduct(id: number | string) {
    try {
        const r = await fetch(`${API_URL}/shop/products/${id}/`, { headers: shopAuthHeaders(), cache: 'no-store' });
        return r.ok ? r.json() : null;
    } catch { return null; }
}

export async function createProduct(data: any) {
    const r = await fetch(`${API_URL}/shop/products/`, {
        method: 'POST', headers: shopAuthHeaders(), body: JSON.stringify(data), cache: 'no-store',
    });
    revalidatePath('/shop');
    return r.ok ? { success: true, data: await r.json() } : { success: false, error: await r.text() };
}

export async function updateProduct(id: number | string, data: any) {
    const r = await fetch(`${API_URL}/shop/products/${id}/`, {
        method: 'PATCH', headers: shopAuthHeaders(), body: JSON.stringify(data), cache: 'no-store',
    });
    revalidatePath('/shop');
    return r.ok ? { success: true, data: await r.json() } : { success: false, error: await r.text() };
}

export async function deleteProduct(id: number | string) {
    const r = await fetch(`${API_URL}/shop/products/${id}/`, {
        method: 'DELETE', headers: shopAuthHeaders(), cache: 'no-store',
    });
    revalidatePath('/shop');
    return r.ok;
}
