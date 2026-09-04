'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';

const ENDPOINT = API_ENDPOINTS.cms.group_benefits;

export async function getGroupBenefits() {
    try {
        return await fetchAPI(ENDPOINT, { next: { revalidate: 60 } });
    } catch (error) {
        return [];
    }
}

export async function getGroupBenefit(id: string) {
    try {
        return await fetchAPI(`${ENDPOINT}${id}/`, { next: { revalidate: 60 } });
    } catch (error) {
        return null;
    }
}

export async function createGroupBenefit(data: any) {
    try {
        const result = await postAPI(ENDPOINT, data);
        revalidatePath('/admin/cms/groups');
        revalidatePath('/groups');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create group benefit' };
    }
}

export async function updateGroupBenefit(id: string, data: any) {
    try {
        const result = await putAPI(`${ENDPOINT}${id}/`, data);
        revalidatePath('/admin/cms/groups');
        revalidatePath('/groups');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update group benefit' };
    }
}

export async function deleteGroupBenefit(id: string) {
    try {
        await deleteAPI(`${ENDPOINT}${id}/`);
        revalidatePath('/admin/cms/groups');
        revalidatePath('/groups');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete group benefit' };
    }
}
