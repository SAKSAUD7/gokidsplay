import { NextResponse } from 'next/server';
import { fillHours, hoursPlaceholdersFromConfig } from '@/lib/hours-text';

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
        const [res, configRes] = await Promise.all([
            fetch(`${backendUrl}/cms/timing-cards/`, { next: { revalidate: 60 } }), // cache for 60 seconds
            fetch(`${backendUrl}/cms/session-booking-config/1/`, { next: { revalidate: 60 } }).catch(() => null),
        ]);

        if (!res.ok) {
            // Backend error — return empty array so the UI just hides gracefully
            return NextResponse.json([]);
        }

        const data = await res.json();
        const config = configRes && configRes.ok ? await configRes.json() : null;
        // {open}, {close}, {days}… come from the Session Booking opening hours
        return NextResponse.json(Array.isArray(data) ? fillHours(data, hoursPlaceholdersFromConfig(config)) : []);
    } catch {
        // Network error / backend down — fail silently
        return NextResponse.json([]);
    }
}
