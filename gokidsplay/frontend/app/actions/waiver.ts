'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[waiver]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[waiver] error:', e); return null; }
}

export async function submitWaiver(data: any) {
    try {
        const r = await fetch(`${BASE}/bookings/waivers/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            cache: 'no-store',
        });
        const json = await r.json().catch(() => ({}));
        if (!r.ok) return { success: false, error: json?.detail || 'Submission failed' };
        return { success: true, data: json };
    } catch(e: any) {
        return { success: false, error: e.message || 'Network error' };
    }
}

export async function getWaivers(params?: { booking_id?: number; page?: number }) {
    let url = `${BASE}/bookings/waivers/`;
    const qs = new URLSearchParams();
    if (params?.booking_id) qs.set('booking_id', String(params.booking_id));
    if (params?.page) qs.set('page', String(params.page));
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url);
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}
