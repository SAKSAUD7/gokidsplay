'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';

const ENDPOINT = API_ENDPOINTS.cms.pricing_plans;

export async function getPricingPlans() {
    try {
        return await fetchAPI(ENDPOINT, { next: { tags: ['pricing-plans'], revalidate: 0 } });
    } catch (error) {
        return [];
    }
}

export async function getPricingPlan(id: string) {
    try {
        return await fetchAPI(`${ENDPOINT}${id}/`, { next: { tags: ['pricing-plans'], revalidate: 0 } });
    } catch (error) {
        return null;
    }
}

export async function createPricingPlan(data: any) {
    try {
        const token = cookies().get('admin_token')?.value;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;

        const result = await postAPI(ENDPOINT, data, { headers });
        revalidateTag('pricing-plans');
        revalidatePath('/admin/cms/pricing-plans', 'layout');
        revalidatePath('/pricing', 'layout');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create pricing plan' };
    }
}

export async function updatePricingPlan(id: string, data: any) {
    try {
        const token = cookies().get('admin_token')?.value;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;

        const result = await putAPI(`${ENDPOINT}${id}/`, data, { headers });
        revalidateTag('pricing-plans');
        revalidatePath('/admin/cms/pricing-plans', 'layout');
        revalidatePath('/pricing', 'layout');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update pricing plan' };
    }
}

export async function deletePricingPlan(id: string) {
    try {
        const token = cookies().get('admin_token')?.value;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;

        await deleteAPI(`${ENDPOINT}${id}/`, { headers });
        revalidateTag('pricing-plans');
        revalidatePath('/admin/cms/pricing-plans', 'layout');
        revalidatePath('/pricing', 'layout');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete pricing plan' };
    }
}
