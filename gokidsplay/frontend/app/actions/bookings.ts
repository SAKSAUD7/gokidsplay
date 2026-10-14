'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[bookings]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[bookings] error:', e); return null; }
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
}

export async function getBookings(params?: { page?: number; status?: string; search?: string }) {
    let url = `${BASE}/bookings/bookings/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function getBooking(id: number | string) {
    return sf(`${BASE}/bookings/bookings/${id}/`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
    });
}

export async function updateBookingStatus(id: number, status: string, notes?: string) {
    return sf(`${BASE}/bookings/bookings/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ booking_status: status, ...(notes ? { notes } : {}) }),
    });
}

export async function getPartyBookings(params?: { page?: number; status?: string }) {
    let url = `${BASE}/bookings/party-bookings/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function getPartyBooking(id: number | string) {
    return sf(`${BASE}/bookings/party-bookings/${id}/`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
    });
}

export async function getDashboardStats() {
    return sf(`${BASE}/bookings/dashboard-stats/`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
    });
}

export async function getCustomers(params?: { page?: number; search?: string }) {
    let url = `${BASE}/bookings/customers/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function getTicket(bookingId: string) {
    return sf(`${BASE}/bookings/bookings/${bookingId}/ticket/`);
}

export async function getBookingByReference(ref: string) {
    return sf(`${BASE}/bookings/bookings/by-reference/${ref}/`);
}
