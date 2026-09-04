'use server';

/**
 * Universal CMS Utilities
 *
 * These functions provide a consistent, authenticated interface for saving
 * and deleting CMS items across all models. All requests go through the
 * Django backend with the admin_token cookie so CRUD operations are authorized.
 */

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Always resolve via 127.0.0.1 to avoid Node.js IPv6 issues
const API_URL = (
    process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1'
).replace('localhost', '127.0.0.1');

function getAuthHeaders(): Record<string, string> {
    const token = cookies().get('admin_token')?.value;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export interface CMSSaveResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Save a CMS item (create or update)
 */
export async function saveCMSItem(
    model: string,
    data: Record<string, any>,
    id?: number
): Promise<CMSSaveResult> {
    try {
        const url = id
            ? `${API_URL}/cms/${model}/${id}/`
            : `${API_URL}/cms/${model}/`;

        const method = id ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
            cache: 'no-store',
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ detail: 'Save failed' }));
            console.error(`[CMS] saveCMSItem ${method} ${url} failed ${res.status}:`, error);
            return {
                success: false,
                error: error.detail || error.error || `Failed with status ${res.status}`,
            };
        }

        // 204 No Content for some updates
        if (res.status === 204) {
            return { success: true };
        }

        const result = await res.json();
        revalidatePath('/admin/cms');
        return { success: true, data: result };
    } catch (error) {
        console.error('[CMS] saveCMSItem exception:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Delete a CMS item
 */
export async function deleteCMSItem(
    model: string,
    id: number
): Promise<CMSSaveResult> {
    try {
        const url = `${API_URL}/cms/${model}/${id}/`;

        const res = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            cache: 'no-store',
        });

        // 204 No Content is the standard success for DELETE
        if (res.ok || res.status === 204) {
            revalidatePath('/admin/cms');
            return { success: true };
        }

        const errorBody = await res.text().catch(() => '');
        console.error(`[CMS] deleteCMSItem DELETE ${url} failed ${res.status}:`, errorBody);
        return {
            success: false,
            error: `Delete failed (${res.status})`,
        };
    } catch (error) {
        console.error('[CMS] deleteCMSItem exception:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Fetch a single CMS item
 */
export async function getCMSItem(
    model: string,
    id: number
): Promise<any> {
    const token = cookies().get('admin_token')?.value;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/cms/${model}/${id}/`, {
        headers,
        cache: 'no-store',
    });

    if (!res.ok) throw new Error('Failed to fetch item');
    return res.json();
}

/**
 * Fetch all items for a model
 */
export async function getCMSItems(model: string): Promise<any[]> {
    const token = cookies().get('admin_token')?.value;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/cms/${model}/`, {
        headers,
        cache: 'no-store',
    });

    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
}
