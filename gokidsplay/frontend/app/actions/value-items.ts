'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[value-items]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[value-items] error:', e); return null; }
}

export async function getValueItems() {
    const data = await sf(`${BASE}/cms/value-items/`);
    if (!data) return [];
    return Array.isArray(data) ? data.filter((v: any) => v.active !== false) : (data.results || []);
}

export async function createValueItem(data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/value-items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function updateValueItem(id: number, data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/value-items/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}
