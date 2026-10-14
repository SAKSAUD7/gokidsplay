'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[users]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[users] error:', e); return null; }
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';
}

function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

export async function getAdminUsers(params?: { page?: number; search?: string }) {
    let url = `${BASE}/core/users/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function getUsers(params?: { page?: number; search?: string }) {
    return getAdminUsers(params);
}

export async function getAdminUser(id: number | string) {
    return sf(`${BASE}/core/users/${id}/`, { headers: authHeaders() });
}

export async function getCurrentUser() {
    return sf(`${BASE}/core/users/me/`, { headers: authHeaders() });
}

export async function createAdminUser(data: any) {
    return sf(`${BASE}/core/users/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function createUser(data: any) {
    return createAdminUser(data);
}

export async function updateAdminUser(id: number | string, data: any) {
    return sf(`${BASE}/core/users/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateUser(id: number | string, data: any) {
    return updateAdminUser(id, data);
}

export async function deleteAdminUser(id: number | string) {
    const r = await fetch(`${BASE}/core/users/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

export async function deleteUser(id: number | string) {
    return deleteAdminUser(id);
}

export async function resetAdminPassword(id: number | string, newPassword: string) {
    return sf(`${BASE}/core/users/${id}/reset-password/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ new_password: newPassword }),
    });
}

export async function getRoles() {
    const data = await sf(`${BASE}/core/roles/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getUserStats() {
    return sf(`${BASE}/core/users/stats/`, { headers: authHeaders() });
}

export async function getRecentActivity() {
    const data = await sf(`${BASE}/core/users/recent-activity/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}
