'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

export async function validateVoucher(code: string, orderAmount: number, bookingDatetime?: string) {
    try {
        const body: any = { code, order_amount: orderAmount };
        if (bookingDatetime) body.booking_datetime = bookingDatetime;
        const r = await fetch(`${BASE}/shop/vouchers/validate/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            cache: 'no-store',
        });
        const json = await r.json();
        return json;
    } catch(e: any) {
        return { valid: false, error: e.message || 'Network error' };
    }
}
