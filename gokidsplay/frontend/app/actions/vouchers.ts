'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[vouchers]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[vouchers] error:', e); return null; }
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
}

export async function getVouchers() {
    const data = await sf(`${BASE}/shop/vouchers/`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createVoucher(data: any) {
    return sf(`${BASE}/shop/vouchers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(data),
    });
}

export async function updateVoucher(id: number, data: any) {
    return sf(`${BASE}/shop/vouchers/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(data),
    });
}

export async function deleteVoucher(id: number) {
    const r = await fetch(`${BASE}/shop/vouchers/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        cache: 'no-store',
    });
    return r.ok;
}

export async function validateVoucher(code: string, orderAmount: number, bookingDatetime?: string) {
    const body: any = { code, order_amount: orderAmount };
    if (bookingDatetime) body.booking_datetime = bookingDatetime;
    return sf(`${BASE}/shop/vouchers/validate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}
