'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';

const ENDPOINT = API_ENDPOINTS.cms.facility_items;

export async function getFacilityItems() {
    try {
        return await fetchAPI(ENDPOINT, { next: { revalidate: 60 } });
    } catch (error) {
        return [];
    }
}

export async function getFacilityItem(id: string) {
    try {
        return await fetchAPI(`${ENDPOINT}${id}/`, { next: { revalidate: 60 } });
    } catch (error) {
        return null;
    }
}

export async function createFacilityItem(data: any) {
    try {
        const token = cookies().get('admin_token')?.value;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;

        const result = await postAPI(ENDPOINT, data, { headers });
        revalidatePath('/admin/cms/attractions');
        revalidatePath('/attractions');
        revalidatePath('/facilities');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create facility' };
    }
}

export async function updateFacilityItem(id: string, data: any) {
    try {
        const token = cookies().get('admin_token')?.value;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;

        const result = await putAPI(`${ENDPOINT}${id}/`, data, { headers });
        revalidatePath('/admin/cms/attractions');
        revalidatePath('/attractions');
        revalidatePath('/facilities');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update facility' };
    }
}

export async function deleteFacilityItem(id: string) {
    try {
        const token = cookies().get('admin_token')?.value;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;

        await deleteAPI(`${ENDPOINT}${id}/`, { headers });
        revalidatePath('/admin/cms/attractions');
        revalidatePath('/attractions');
        revalidatePath('/facilities');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete facility' };
    }
}
