'use server';

import { fetchAPI } from '../lib/server-api';
import { revalidatePath } from 'next/cache';

export interface Logo {
    id: number;
    name: string;
    image: string;
    image_url: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export async function getLogos(): Promise<Logo[]> {
    try {
        const res = await fetchAPI('/core/logos/');
        if (!res || !res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error('Error fetching logos:', error);
        return [];
    }
}

export async function getActiveLogo(): Promise<Logo | null> {
    try {
        const res = await fetchAPI('/core/logos/active/');
        if (!res || !res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching active logo:', error);
        return null;
    }
}

export async function createLogo(formData: FormData) {
    try {
        const res = await fetchAPI('/core/logos/', {
            method: 'POST',
            body: formData,
            // Don't set Content-Type header - let browser set it with boundary for multipart
            headers: undefined
        });

        if (!res || !res.ok) {
            const error = await res?.json();
            return { success: false, error: error?.detail || 'Failed to create logo' };
        }

        revalidatePath('/admin/cms/logos');
        revalidatePath('/admin/cms');
        return { success: true };
    } catch (error) {
        console.error('Error creating logo:', error);
        return { success: false, error: 'Failed to create logo' };
    }
}

export async function setActiveLogo(id: number) {
    try {
        const res = await fetchAPI(`/core/logos/${id}/set_active/`, {
            method: 'POST'
        });

        if (!res || !res.ok) {
            return { success: false, error: 'Failed to set active logo' };
        }

        revalidatePath('/admin/cms/logos');
        revalidatePath('/admin/cms');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error setting active logo:', error);
        return { success: false, error: 'Failed to set active logo' };
    }
}

export async function deleteLogo(id: number) {
    try {
        const res = await fetchAPI(`/core/logos/${id}/`, {
            method: 'DELETE'
        });

        if (!res || !res.ok) {
            return { success: false, error: 'Failed to delete logo' };
        }

        revalidatePath('/admin/cms/logos');
        revalidatePath('/admin/cms');
        return { success: true };
    } catch (error) {
        console.error('Error deleting logo:', error);
        return { success: false, error: 'Failed to delete logo' };
    }
}
