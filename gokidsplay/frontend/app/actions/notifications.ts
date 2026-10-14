'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[notifications]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[notifications] error:', e); return null; }
}

export async function getNotifications() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const data = await sf(`${BASE}/core/notifications/`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function markNotificationRead(id: number) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/core/notifications/${id}/mark_read/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
}

export async function markAllNotificationsRead() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return sf(`${BASE}/core/notifications/mark_all_read/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
}
