'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[pages]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[pages] error:', e); return null; }
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
}

export async function getCmsPages() {
    const data = await sf(`${BASE}/cms/pages/`);
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getCmsPage(slug: string) {
    const data = await sf(`${BASE}/cms/pages/?slug=${slug}`);
    if (!data) return null;
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.find((p: any) => p.slug === slug) || null;
}

export async function updateCmsPage(id: number, data: any) {
    return sf(`${BASE}/cms/pages/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(data),
    });
}
