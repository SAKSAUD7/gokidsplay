import { NextResponse } from 'next/server';

/**
 * Proxy route for timing-cards.
 * The TimingCardsClient (browser) calls /api/timing-cards (same origin),
 * and THIS server-side route forwards the request to Django.
 * This completely avoids browser CORS restrictions.
 */
export async function GET() {
    const backendUrl = process.env.API_URL
        || process.env.NEXT_PUBLIC_API_URL
        || 'http://localhost:9000/api/v1';

    try {
        const res = await fetch(`${backendUrl}/cms/timing-cards/`, {
            next: { revalidate: 60 }, // cache for 60 seconds
        });

        if (!res.ok) {
            // Backend error — return empty array so the UI just hides gracefully
            return NextResponse.json([]);
        }

        const data = await res.json();
        return NextResponse.json(Array.isArray(data) ? data : []);
    } catch {
        // Network error / backend down — fail silently
        return NextResponse.json([]);
    }
}
