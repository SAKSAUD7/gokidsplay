"use server";

import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from "@/lib/api";
import { revalidatePath } from "next/cache";

// Campaigns

export async function getCampaigns() {
    return await fetchAPI<any[]>(API_ENDPOINTS.marketing.campaigns);
}

export async function createCampaign(data: any) {
    await postAPI(API_ENDPOINTS.marketing.campaigns, data);
    revalidatePath('/admin/marketing');
}

export async function updateCampaign(id: number, data: any) {
    await putAPI(`${API_ENDPOINTS.marketing.campaigns}${id}/`, data);
    revalidatePath('/admin/marketing');
}

export async function deleteCampaign(id: number) {
    await deleteAPI(`${API_ENDPOINTS.marketing.campaigns}${id}/`);
    revalidatePath('/admin/marketing');
}

export async function sendCampaign(id: number) {
    await postAPI(`${API_ENDPOINTS.marketing.campaigns}${id}/send/`, {});
    revalidatePath('/admin/marketing');
}

// Templates

export async function getTemplates() {
    return await fetchAPI<any[]>(API_ENDPOINTS.marketing.templates);
}

export async function getTemplate(id: number) {
    return await fetchAPI<any>(`${API_ENDPOINTS.marketing.templates}${id}/`);
}

export async function createTemplate(data: any) {
    await postAPI(API_ENDPOINTS.marketing.templates, data);
    revalidatePath('/admin/marketing/templates');
}

export async function updateTemplate(id: number, data: any) {
    await putAPI(`${API_ENDPOINTS.marketing.templates}${id}/`, data);
    revalidatePath('/admin/marketing/templates');
}

export async function deleteTemplate(id: number) {
    await deleteAPI(`${API_ENDPOINTS.marketing.templates}${id}/`);
    revalidatePath('/admin/marketing/templates');
}

// Dashboard Stats

export interface MarketingStats {
    total_campaigns: number;
    active_campaigns: number;
    sent_campaigns: number;
    total_emails_sent: number;
    avg_open_rate: number;
    avg_click_rate: number;
    subscriber_count: number;
    unsubscribe_count: number;
    unsubscribe_rate: number;
    recent_campaigns: {
        id: number;
        title: string;
        sent_at: string;
        sent_count: number;
        open_rate: number;
        click_rate: number;
    }[];
    monthly_growth: {
        month: string;
        count: number;
    }[];
}

export async function getMarketingStats(): Promise<MarketingStats> {
    try {
        const data = await fetchAPI<MarketingStats>(`${API_ENDPOINTS.marketing.campaigns}dashboard_stats/`);
        return data;
    } catch (error) {
        console.error('Error fetching marketing stats:', error);
        // Return empty stats instead of null so UI still renders
        return {
            total_campaigns: 0,
            active_campaigns: 0,
            sent_campaigns: 0,
            total_emails_sent: 0,
            avg_open_rate: 0,
            avg_click_rate: 0,
            subscriber_count: 0,
            unsubscribe_count: 0,
            unsubscribe_rate: 0,
            recent_campaigns: [],
            monthly_growth: [],
        };
    }
}


