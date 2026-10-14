'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[activities]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[activities] error:', e); return null; }
}

export async function getActivities() {
    const data = await sf(`${BASE}/cms/activities/`);
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getActivity(id: number) {
    return sf(`${BASE}/cms/activities/${id}/`);
}

export async function createActivity(data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/activities/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function updateActivity(id: number, data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/activities/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function deleteActivity(id: number) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const r = await fetch(`${BASE}/cms/activities/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
    });
    return r.ok;
}
