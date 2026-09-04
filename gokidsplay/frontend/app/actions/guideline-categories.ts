'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';

const ENDPOINT = API_ENDPOINTS.cms.guideline_categories;

export async function getGuidelineCategories() {
    try {
        return await fetchAPI(ENDPOINT, { next: { revalidate: 60 } });
    } catch (error) {
        return [];
    }
}

export async function getGuidelineCategory(id: string) {
    try {
        return await fetchAPI(`${ENDPOINT}${id}/`, { next: { revalidate: 60 } });
    } catch (error) {
        return null;
    }
}

export async function createGuidelineCategory(data: any) {
    try {
        const result = await postAPI(ENDPOINT, data);
        revalidatePath('/admin/cms/guidelines');
        revalidatePath('/guidelines');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create guideline category' };
    }
}

export async function updateGuidelineCategory(id: string, data: any) {
    try {
        const result = await putAPI(`${ENDPOINT}${id}/`, data);
        revalidatePath('/admin/cms/guidelines');
        revalidatePath('/guidelines');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update guideline category' };
    }
}

export async function deleteGuidelineCategory(id: string) {
    try {
        await deleteAPI(`${ENDPOINT}${id}/`);
        revalidatePath('/admin/cms/guidelines');
        revalidatePath('/guidelines');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete guideline category' };
    }
}
