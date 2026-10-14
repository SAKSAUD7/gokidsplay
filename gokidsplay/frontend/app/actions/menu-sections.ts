'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[menu-sections]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[menu-sections] error:', e); return null; }
}

export async function getMenuSections() {
    const data = await sf(`${BASE}/cms/menu-sections/`);
    if (!data) return [];
    return Array.isArray(data) ? data.filter((m: any) => m.active !== false) : (data.results || []);
}

export async function createMenuSection(data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/menu-sections/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function updateMenuSection(id: number, data: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/cms/menu-sections/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function deleteMenuSection(id: number) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const r = await fetch(`${BASE}/cms/menu-sections/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
    });
    return r.ok;
}
