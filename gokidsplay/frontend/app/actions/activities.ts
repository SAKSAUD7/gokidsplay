'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI, postAPI, putAPI, deleteAPI } from '@/app/lib/server-api';

const ENDPOINT = '/cms/activities/';

export async function getActivities() {
    try {
        const res = await fetchAPI(ENDPOINT, { next: { revalidate: 60 } });
        if (!res || !res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error('Failed to fetch activities:', error);
        return [];
    }
}

export async function getActivity(id: string) {
    try {
        const res = await fetchAPI(`${ENDPOINT}${id}/`, { next: { revalidate: 60 } });
        if (!res || !res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error(`Failed to fetch activity ${id}:`, error);
        return null;
    }
}

export async function createActivity(data: any) {
    try {
        const result = await postAPI(ENDPOINT, data);
        revalidatePath('/admin/cms/attractions');
        return { success: true, item: result };
    } catch (error) {
        console.error('Failed to create activity:', error);
        // Return plain object instead of Error instance
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create activity'
        };
    }
}

export async function updateActivity(id: string, data: any) {
    try {
        const result = await putAPI(`${ENDPOINT}${id}/`, data);
        revalidatePath('/admin/cms/attractions');
        revalidatePath(`/admin/cms/attractions/${id}`);
        return { success: true, item: result };
    } catch (error) {
        console.error(`Failed to update activity ${id}:`, error);
        // Return plain object instead of Error instance
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update activity'
        };
    }
}

export async function deleteActivity(id: string) {
    try {
        await deleteAPI(`${ENDPOINT}${id}/`);
        revalidatePath('/admin/cms/attractions');
        return { success: true };
    } catch (error) {
        console.error(`Failed to delete activity ${id}:`, error);
        // Return plain object instead of Error instance
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete activity'
        };
    }
}
