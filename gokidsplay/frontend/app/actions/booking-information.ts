'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[booking-information]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[booking-information] error:', e); return null; }
}

export async function getBookingInformation(type?: string) {
    const url = type
        ? `${BASE}/cms/booking-information/?booking_type=${type}`
        : `${BASE}/cms/booking-information/`;
    const data = await sf(url);
    if (!data) return type ? null : [];
    if (type) {
        const list = Array.isArray(data) ? data : (data.results || []);
        return list.find((b: any) => b.booking_type === type) || null;
    }
    return Array.isArray(data) ? data : (data.results || []);
}

export async function updateBookingInformation(id: number, data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/booking-information/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}
