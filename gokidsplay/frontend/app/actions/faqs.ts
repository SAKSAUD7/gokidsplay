'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';

const ENDPOINT = API_ENDPOINTS.cms.faqs;

type ActionResult = { success: boolean; error?: string };

function revalidateFaqPages() {
    revalidatePath('/admin/cms/faqs');
    revalidatePath('/faq');
}

export async function getFaqs(): Promise<any[]> {
    try {
        const data = await fetchAPI(ENDPOINT, { next: { revalidate: 60 } });
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

export async function getFaq(id: string): Promise<any> {
    try {
        const data = await fetchAPI(`${ENDPOINT}${id}/`, { next: { revalidate: 60 } });
        return data;
    } catch (error) {
        return null;
    }
}

// CMSForm expects { success, error } from its onSubmit action
export async function createFaq(data: any): Promise<ActionResult> {
    try {
        await postAPI(ENDPOINT, data);
        revalidateFaqPages();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to create FAQ' };
    }
}

export async function updateFaq(id: string, data: any): Promise<ActionResult> {
    try {
        await putAPI(`${ENDPOINT}${id}/`, data);
        revalidateFaqPages();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to update FAQ' };
    }
}

export async function deleteFaq(id: string): Promise<void> {
    await deleteAPI(`${ENDPOINT}${id}/`);
    revalidateFaqPages();
}
