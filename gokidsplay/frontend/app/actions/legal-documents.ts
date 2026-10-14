'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[legal-documents]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[legal-documents] error:', e); return null; }
}

export async function getLegalDocuments() {
    const data = await sf(`${BASE}/cms/legal-documents/`);
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getLegalDocument(slug: string) {
    const data = await sf(`${BASE}/cms/legal-documents/?slug=${slug}`);
    if (!data) return null;
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.find((d: any) => d.slug === slug) || null;
}

export async function updateLegalDocument(id: number, data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/legal-documents/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}
