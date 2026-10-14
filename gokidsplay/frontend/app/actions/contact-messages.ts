'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
}

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[contact-messages]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[contact-messages] error:', e); return null; }
}

export async function getContactMessages(params?: { page?: number; is_read?: boolean }) {
    let url = `${BASE}/cms/contact-messages/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.is_read !== undefined) qs.set('is_read', String(params.is_read));
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function markContactMessageRead(id: number) {
    return sf(`${BASE}/cms/contact-messages/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ is_read: true }),
    });
}

export async function sendContactMessage(data: { name: string; email: string; phone?: string; message: string }) {
    try {
        const r = await fetch(`${BASE}/cms/contact-messages/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            cache: 'no-store',
        });
        const json = await r.json().catch(() => ({}));
        if (!r.ok) return { success: false, error: json?.detail || 'Failed to send message' };
        return { success: true, data: json };
    } catch(e: any) {
        return { success: false, error: e.message || 'Network error' };
    }
}
