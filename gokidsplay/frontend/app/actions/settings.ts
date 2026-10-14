'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[settings]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[settings] error:', e); return null; }
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';
}

function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

export async function getSettings() {
    const data = await sf(`${BASE}/core/settings/`);
    if (!data) return null;
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.length > 0 ? list[0] : null;
}

export async function updateSettings(id: number | string, data: any) {
    return sf(`${BASE}/core/settings/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updatePassword(data: { current_password: string; new_password: string }) {
    return sf(`${BASE}/accounts/change-password/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}
