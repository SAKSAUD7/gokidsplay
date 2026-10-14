'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

export async function createPartyBooking(data: any) {
    try {
        const r = await fetch(`${BASE}/bookings/party-bookings/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            cache: 'no-store',
        });
        const json = await r.json();
        if (!r.ok) return { success: false, error: json?.detail || JSON.stringify(json) };
        return { success: true, data: json };
    } catch(e: any) {
        console.error('[createPartyBooking] error:', e);
        return { success: false, error: e.message || 'Network error' };
    }
}
