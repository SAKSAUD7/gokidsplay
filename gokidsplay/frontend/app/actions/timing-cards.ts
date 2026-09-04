'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';

const ENDPOINT = API_ENDPOINTS.cms.timing_cards;

export async function getTimingCards() {
    try {
        return await fetchAPI(ENDPOINT, { next: { revalidate: 60 } });
    } catch (error) {
        return [];
    }
}

export async function getTimingCard(id: string) {
    try {
        return await fetchAPI(`${ENDPOINT}${id}/`, { next: { revalidate: 60 } });
    } catch (error) {
        return null;
    }
}

export async function createTimingCard(data: any) {
    try {
        const result = await postAPI(ENDPOINT, data);
        revalidatePath('/admin/cms/timing-cards');
        revalidatePath('/');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create timing card' };
    }
}

export async function updateTimingCard(id: string, data: any) {
    try {
        const result = await putAPI(`${ENDPOINT}${id}/`, data);
        revalidatePath('/admin/cms/timing-cards');
        revalidatePath('/');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update timing card' };
    }
}

export async function deleteTimingCard(id: string) {
    try {
        await deleteAPI(`${ENDPOINT}${id}/`);
        revalidatePath('/admin/cms/timing-cards');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete timing card' };
    }
}
