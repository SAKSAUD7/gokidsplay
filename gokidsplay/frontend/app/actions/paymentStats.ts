'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
}

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[paymentStats]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[paymentStats] error:', e); return null; }
}

export async function getPaymentStats() {
    return sf(`${BASE}/payments/stats/`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
    });
}

export async function getPaymentTransactions(params?: { page?: number }) {
    let url = `${BASE}/payments/transactions/`;
    if (params?.page) url += `?page=${params.page}`;
    const data = await sf(url, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!data) return { results: [], count: 0 };
    return data;
}
