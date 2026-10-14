'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[marketing]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[marketing] error:', e); return null; }
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';
}

function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

// ── CAMPAIGNS ────────────────────────────────────────────────────────────
export async function getCampaigns(params?: { page?: number }) {
    let url = `${BASE}/marketing/campaigns/`;
    if (params?.page) url += `?page=${params.page}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function getCampaign(id: number | string) {
    return sf(`${BASE}/marketing/campaigns/${id}/`, { headers: authHeaders() });
}

export async function createCampaign(data: any) {
    return sf(`${BASE}/marketing/campaigns/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateCampaign(id: number | string, data: any) {
    return sf(`${BASE}/marketing/campaigns/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteCampaign(id: number | string) {
    const r = await fetch(`${BASE}/marketing/campaigns/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

export async function sendCampaign(id: number | string) {
    return sf(`${BASE}/marketing/campaigns/${id}/send/`, {
        method: 'POST',
        headers: authHeaders(),
    });
}

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────
export async function getTemplates(params?: { page?: number }) {
    let url = `${BASE}/marketing/templates/`;
    if (params?.page) url += `?page=${params.page}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}

// Alias used by some components
export const getEmailTemplates = getTemplates;

export async function getTemplate(id: number | string) {
    return sf(`${BASE}/marketing/templates/${id}/`, { headers: authHeaders() });
}

export async function createTemplate(data: any) {
    return sf(`${BASE}/marketing/templates/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateTemplate(id: number | string, data: any) {
    return sf(`${BASE}/marketing/templates/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteTemplate(id: number | string) {
    const r = await fetch(`${BASE}/marketing/templates/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── UNSUBSCRIBES ─────────────────────────────────────────────────────────
export async function getUnsubscribes() {
    const data = await sf(`${BASE}/marketing/unsubscribes/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

// ── STATS ────────────────────────────────────────────────────────────────
export async function getMarketingStats() {
    return sf(`${BASE}/marketing/stats/`, { headers: authHeaders() });
}

// ── SUBSCRIBERS ──────────────────────────────────────────────────────────
export async function getSubscribers(params?: { page?: number }) {
    let url = `${BASE}/marketing/subscribers/`;
    if (params?.page) url += `?page=${params.page}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}
