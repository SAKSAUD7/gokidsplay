'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[faqs]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[faqs] error:', e); return null; }
}

export async function getFaqs() {
    const data = await sf(`${BASE}/cms/faqs/`);
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createFaq(data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/faqs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function updateFaq(id: number, data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/faqs/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function deleteFaq(id: number) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const r = await fetch(`${BASE}/cms/faqs/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
    });
    return r.ok;
}
