'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[party-packages]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[party-packages] error:', e); return null; }
}

export async function getPartyPackages() {
    const data = await sf(`${BASE}/cms/party-packages/`);
    if (!data) return [];
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.filter((p: any) => p.active !== false);
}

export async function deletePartyPackage(id: number) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const r = await fetch(`${BASE}/cms/party-packages/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
    });
    return r.ok;
}

export async function createPartyPackage(data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const r = await sf(`${BASE}/cms/party-packages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
    return r;
}

export async function updatePartyPackage(id: number, data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const r = await sf(`${BASE}/cms/party-packages/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
    return r;
}
