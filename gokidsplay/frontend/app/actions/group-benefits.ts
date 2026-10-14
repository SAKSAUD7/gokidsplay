'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[group-benefits]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[group-benefits] error:', e); return null; }
}

export async function getGroupBenefits() {
    const data = await sf(`${BASE}/cms/group-benefits/`);
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createGroupBenefit(data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/group-benefits/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function updateGroupBenefit(id: number, data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/group-benefits/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function deleteGroupBenefit(id: number) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const r = await fetch(`${BASE}/cms/group-benefits/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
    });
    return r.ok;
}
