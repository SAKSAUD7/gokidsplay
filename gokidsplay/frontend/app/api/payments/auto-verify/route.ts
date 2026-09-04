import { NextResponse } from 'next/server';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1').replace('localhost', '127.0.0.1');

/**
 * POST /api/payments/auto-verify
 * Triggers a backend sweep of all stale SUMUP payments (status=CREATED in last 24h)
 * and verifies each one against the SumUp API, updating the booking status to PAID
 * if SumUp confirms payment.
 *
 * Called automatically from:
 *  - The /book/success page on every load (ensures the redirected payment is verified
 *    even if the first retry loop was interrupted)
 *  - The admin payments page on load (sweeps any lingering stale records)
 */
export async function POST() {
    try {
        const controller = new AbortController();
        // Give backend 60s — it may need to call SumUp for many payments
        const timeoutId = setTimeout(() => controller.abort(), 60_000);

        let res: Response;
        try {
            res = await fetch(`${BACKEND}/payments/auto-verify/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
                cache: 'no-store',
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeoutId);
        }

        const data = await res.json();
        return NextResponse.json(data, { status: res.ok ? 200 : 500 });
    } catch (err: any) {
        const isTimeout = err?.name === 'AbortError';
        console.error('[AutoVerify Proxy] Error:', err);
        return NextResponse.json(
            { success: false, error: isTimeout ? 'Auto-verify timed out' : 'Failed to reach payment service' },
            { status: 504 }
        );
    }
}
