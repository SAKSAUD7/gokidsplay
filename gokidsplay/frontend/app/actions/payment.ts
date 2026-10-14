'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[payment]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[payment] error:', e); return null; }
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';
}

/**
 * Initiates a payment for a booking.
 * For SumUp integration this returns a checkout URL.
 */
export async function initiatePayment(data: {
    booking_id: number | string;
    amount: number;
    booking_type?: 'session' | 'party';
}) {
    return sf(`${BASE}/payments/initiate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        cache: 'no-store',
    } as RequestInit);
}

/**
 * Alias used by some booking pages.
 */
export const createPaymentOrder = initiatePayment;

export async function getPaymentStatus(transactionId: string) {
    return sf(`${BASE}/payments/status/${transactionId}/`);
}

export async function getPaymentStats() {
    return sf(`${BASE}/payments/stats/`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    });
}

export async function getPaymentTransactions(params?: { page?: number }) {
    let url = `${BASE}/payments/transactions/`;
    if (params?.page) url += `?page=${params.page}`;
    const data = await sf(url, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    });
    if (!data) return { results: [], count: 0 };
    return data;
}
