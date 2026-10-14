'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[memberships]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[memberships] error:', e); return null; }
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';
}

export async function getMembershipPlans() {
    const data = await sf(`${BASE}/shop/membership-plans/`);
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createMembershipPlan(data: any) {
    return sf(`${BASE}/shop/membership-plans/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
    });
}

export async function updateMembershipPlan(id: number | string, data: any) {
    return sf(`${BASE}/shop/membership-plans/${id}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
    });
}

export async function deleteMembershipPlan(id: number | string) {
    const r = await fetch(`${BASE}/shop/membership-plans/${id}/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
        },
        cache: 'no-store',
    });
    return r.ok;
}
