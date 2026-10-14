'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[facility-items]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[facility-items] error:', e); return null; }
}

export async function getFacilityItems() {
    const data = await sf(`${BASE}/cms/facility-items/`);
    if (!data) return [];
    return Array.isArray(data) ? data.filter((f: any) => f.active !== false) : (data.results || []);
}

export async function createFacilityItem(data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/facility-items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function updateFacilityItem(id: number, data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/facility-items/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function deleteFacilityItem(id: number) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const r = await fetch(`${BASE}/cms/facility-items/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
    });
    return r.ok;
}
