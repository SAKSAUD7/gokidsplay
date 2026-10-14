'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[logs]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[logs] error:', e); return null; }
}

export async function getLogs(params?: { page?: number; limit?: number; action?: string }) {
    let url = `${BASE}/core/logs/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.action) qs.set('action', params.action);
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url);
    if (!data) return { results: [], count: 0 };
    return data;
}
