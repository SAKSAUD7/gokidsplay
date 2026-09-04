'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';
import { transformCmsItem } from '@/app/lib/transformers';

const ENDPOINT = API_ENDPOINTS.cms.menu_sections;

export async function getMenuSections() {
    try {
        const data = await fetchAPI(ENDPOINT, { next: { revalidate: 60 } });
        return Array.isArray(data) ? data.map(transformCmsItem) : [];
    } catch (error) {
        console.error("Error fetching menu sections:", error);
        return [];
    }
}

export async function getMenuSection(id: string) {
    try {
        const data = await fetchAPI(`${ENDPOINT}${id}/`, { next: { revalidate: 60 } });
        return transformCmsItem(data);
    } catch (error) {
        console.error(`Error fetching menu section ${id}:`, error);
        return null;
    }
}

export async function createMenuSection(data: any) {
    try {
        const result = await postAPI(ENDPOINT, data);
        revalidatePath('/admin/cms/menu');
        revalidatePath('/parties'); // Update public page
        return { success: true, item: result };
    } catch (error: any) {
        console.error("Error creating menu section:", error);
        return { success: false, error: 'Failed to create menu section' };
    }
}

export async function updateMenuSection(id: string, data: any) {
    try {
        const result = await putAPI(`${ENDPOINT}${id}/`, data);
        revalidatePath('/admin/cms/menu');
        revalidatePath('/parties'); // Update public page
        return { success: true, item: result };
    } catch (error: any) {
        console.error("Error updating menu section:", error);
        return { success: false, error: 'Failed to update menu section' };
    }
}

export async function deleteMenuSection(id: string) {
    try {
        await deleteAPI(`${ENDPOINT}${id}/`);
        revalidatePath('/admin/cms/menu');
        revalidatePath('/parties'); // Update public page
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting menu section:", error);
        return { success: false, error: 'Failed to delete menu section' };
    }
}
