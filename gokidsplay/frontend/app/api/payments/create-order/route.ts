import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1').replace('localhost', '127.0.0.1');

/**
 * POST /api/payments/create-order
 * Proxies to Django backend — avoids mixed-content HTTPS→HTTP issues
 * since this runs server-side on Azure.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const res = await fetch(`${BACKEND}/payments/create-order/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { error: data.error || 'Payment creation failed' },
                { status: res.status }
            );
        }

        // For SumUp: the backend returns checkout_url pointing to SumUp's hosted payment page
        // For Mock: generate a local success URL (mock still requires verify step)
        if (data.mock && !data.checkout_url) {
            const frontendBase = process.env.NEXT_PUBLIC_FRONTEND_URL
                || 'https://gokidsplay-frontend-d7ftbvf8h8cxe9g5.centralus-01.azurewebsites.net';
            // Mock: go to a "confirm payment" step, not directly to success
            // The success page will call verify, which actually marks the booking CONFIRMED
            data.checkout_url = `${frontendBase}/book/success?order_id=${data.order_id}&booking_id=${body.booking_id}&booking_type=${body.booking_type}&mock=true`;
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[Payment Proxy] Error:', err);
        return NextResponse.json(
            { error: 'Failed to connect to payment service' },
            { status: 500 }
        );
    }
}
