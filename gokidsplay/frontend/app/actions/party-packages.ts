'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';

const ENDPOINT = API_ENDPOINTS.cms.party_packages;

export async function getPartyPackages() {
    try {
        return await fetchAPI(ENDPOINT, { next: { revalidate: 60 } });
    } catch (error) {
        return [];
    }
}

export async function getPartyPackage(id: string) {
    try {
        return await fetchAPI(`${ENDPOINT}${id}/`, { next: { revalidate: 60 } });
    } catch (error) {
        return null;
    }
}

export async function createPartyPackage(data: any) {
    try {
        const token = cookies().get('admin_token')?.value;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;

        const result = await postAPI(ENDPOINT, data, { headers });
        revalidatePath('/admin/cms/pricing-plans'); // Also revalidate pricing admin
        revalidatePath('/parties');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: 'Failed to create party package' };
    }
}

export async function updatePartyPackage(id: string, data: any) {
    try {
        const token = cookies().get('admin_token')?.value;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;

        const result = await putAPI(`${ENDPOINT}${id}/`, data, { headers });
        revalidatePath('/admin/cms/pricing-plans');
        revalidatePath('/parties');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: 'Failed to update party package' };
    }
}

export async function deletePartyPackage(id: string) {
    try {
        const token = cookies().get('admin_token')?.value;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;

        await deleteAPI(`${ENDPOINT}${id}/`, { headers });
        revalidatePath('/admin/cms/pricing-plans');
        revalidatePath('/parties');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete party package' };
    }
}
