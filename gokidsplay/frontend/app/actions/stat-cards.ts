'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';

const ENDPOINT = API_ENDPOINTS.cms.stat_cards; // Need to ensure this exists in lib/api.ts

export async function getStatCards(page?: string) {
    try {
        const url = page ? `${ENDPOINT}?page=${page}` : ENDPOINT;
        return await fetchAPI(url, { next: { revalidate: 60 } });
    } catch (error) {
        return [];
    }
}


export async function getStatCard(id: string) {
    try {
        return await fetchAPI(`${ENDPOINT}${id}/`, { next: { revalidate: 60 } });
    } catch (error) {
        return null;
    }
}

export async function createStatCard(data: any) {
    try {
        const result = await postAPI(ENDPOINT, data);
        revalidatePath('/admin/cms/stat-cards');
        revalidatePath('/'); // Stat cards might be on homepage
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create stat card' };
    }
}

export async function updateStatCard(id: string, data: any) {
    try {
        const result = await putAPI(`${ENDPOINT}${id}/`, data);
        revalidatePath('/admin/cms/stat-cards');
        revalidatePath('/');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update stat card' };
    }
}

export async function deleteStatCard(id: string) {
    try {
        await deleteAPI(`${ENDPOINT}${id}/`);
        revalidatePath('/admin/cms/stat-cards');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete stat card' };
    }
}

