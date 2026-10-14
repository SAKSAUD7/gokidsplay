'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[invitation-templates]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[invitation-templates] error:', e); return null; }
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';
}

function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

export async function getInvitationTemplates() {
    const data = await sf(`${BASE}/invitations/templates/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getInvitationTemplate(id: number | string) {
    return sf(`${BASE}/invitations/templates/${id}/`, { headers: authHeaders() });
}

export async function createInvitationTemplate(data: any) {
    return sf(`${BASE}/invitations/templates/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateInvitationTemplate(id: number | string, data: any) {
    return sf(`${BASE}/invitations/templates/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteInvitationTemplate(id: number | string) {
    const r = await fetch(`${BASE}/invitations/templates/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}
