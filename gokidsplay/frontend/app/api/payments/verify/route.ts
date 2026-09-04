import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1').replace('localhost', '127.0.0.1');

/**
 * POST /api/payments/verify
 * Proxies payment verification to Django backend server-side.
 * Uses a 30s timeout so Azure cold-starts don't cause "Failed to fetch" on the client.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 30-second timeout — SumUp verification can be slow on first wake
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 30_000);

        let res: Response;
        try {
            res = await fetch(`${BACKEND}/payments/verify/`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body),
                cache:   'no-store',
                signal:  controller.signal,
            });
        } finally {
            clearTimeout(timeoutId);
        }

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { error: data.error || 'Payment verification failed' },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (err: any) {
        const isTimeout = err?.name === 'AbortError';
        console.error('[Payment Verify Proxy] Error:', err);
        return NextResponse.json(
            { error: isTimeout ? 'Verification timed out — please try again' : 'Failed to connect to payment service' },
            { status: 504 }
        );
    }
}
