import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1')
    .replace('localhost', '127.0.0.1');

export async function GET(request: NextRequest) {
    try {
        const res = await fetch(`${BACKEND}/bookings/site-alerts/`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        });
        if (!res.ok) {
            return NextResponse.json([], { status: 200 });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        // Fail silently — site alerts are non-critical
        return NextResponse.json([]);
    }
}
