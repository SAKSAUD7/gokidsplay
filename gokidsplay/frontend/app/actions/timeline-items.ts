'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';

const ENDPOINT = API_ENDPOINTS.cms.timeline_items;

export async function getTimelineItems() {
    try {
        return await fetchAPI(ENDPOINT, { next: { revalidate: 60 } });
    } catch (error) {
        return [];
    }
}

export async function getTimelineItem(id: string) {
    try {
        return await fetchAPI(`${ENDPOINT}${id}/`, { next: { revalidate: 60 } });
    } catch (error) {
        return null;
    }
}

export async function createTimelineItem(data: any) {
    try {
        const result = await postAPI(ENDPOINT, data);
        revalidatePath('/admin/cms/timeline-items');
        revalidatePath('/');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create timeline item' };
    }
}

export async function updateTimelineItem(id: string, data: any) {
    try {
        const result = await putAPI(`${ENDPOINT}${id}/`, data);
        revalidatePath('/admin/cms/timeline-items');
        revalidatePath('/');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update timeline item' };
    }
}

export async function deleteTimelineItem(id: string) {
    try {
        await deleteAPI(`${ENDPOINT}${id}/`);
        revalidatePath('/admin/cms/timeline-items');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete timeline item' };
    }
}

