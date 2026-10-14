'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[logos]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[logos] error:', e); return null; }
}

export async function getActiveLogo() {
    const data = await sf(`${BASE}/core/logos/active/`);
    return data;
}

export async function getLogos() {
    const data = await sf(`${BASE}/core/logos/`);
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function uploadLogo(formData: FormData) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    try {
        const r = await fetch(`${BASE}/core/logos/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
            cache: 'no-store',
        });
        if (!r.ok) return null;
        return r.json();
    } catch(e) { console.error('[logos upload] error:', e); return null; }
}

export async function setActiveLogo(id: number) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/core/logos/${id}/set_active/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
}
