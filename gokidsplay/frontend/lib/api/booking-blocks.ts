const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

export interface BookingBlock {
    id: number;
    start_date: string;
    end_date: string;
    reason: string;
    type: 'BLOCKED_DATE' | 'CLOSED_TODAY' | 'OPEN_TODAY' | 'CLOSED' | 'MAINTENANCE' | 'PRIVATE_EVENT' | 'OTHER';
    open_time?: string | null;
    close_time?: string | null;
    blocks_normal_bookings?: boolean;
    blocks_party_bookings?: boolean;
}

/**
 * Fetches site alerts for today (Closed Today / Open Today).
 */
export const fetchSiteAlerts = async (): Promise<BookingBlock[]> => {
    try {
        // Always use a relative URL path — this stays on the same origin (www.gokidsplay.uk)
        // and proxies through the Next.js /api route to avoid CORS issues.
        const url = typeof window !== 'undefined'
            ? `${window.location.origin}/api/bookings/site-alerts`
            : `/api/bookings/site-alerts`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch alerts');
        return await response.json();
    } catch (error) {
        // Fail silently for alerts
        console.warn("Failed to fetch site alerts:", error);
        return [];
    }
};
