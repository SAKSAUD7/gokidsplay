const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

export interface BookingBlock {
    id: number;
    start_date: string;
    end_date: string;
    reason: string;
    type: 'BLOCKED_DATE' | 'CLOSED_TODAY' | 'OPEN_TODAY' | 'CLOSED' | 'MAINTENANCE' | 'PRIVATE_EVENT' | 'OTHER';
    active: boolean;
    priority: number;
}

/**
 * Fetches all active booking blocks that should prevent bookings.
 * Filters for 'BLOCKED_DATE' and legacy types.
 */
export const fetchBookingBlocks = async (): Promise<BookingBlock[]> => {
    try {
        // Use the public endpoint
        const response = await fetch(`${API_URL}/bookings/public/booking-blocks/`);
        if (!response.ok) throw new Error('Failed to fetch blocks');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch booking blocks:", error);
        return [];
    }
};

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

/**
 * Helper to check if a specific date is blocked.
 * Returns the blocking reason if blocked, otherwise null.
 */
export const isDateBlocked = (dateStr: string, blocks: BookingBlock[]): string | null => {
    if (!dateStr || !blocks.length) return null;

    const checkDate = new Date(dateStr);
    // Normalize checkDate to midnight for accurate comparison if blocks are date-based
    // However, blocks come as ISO strings. Let's assume day-level granularity for now based on 'date' input.

    // Simple string comparison might be safer if formats match (YYYY-MM-DD)
    // But blocks have times.

    // User req: "Only the date is blocked (not time slots)"
    // So we check if the selected date falls within any block's range (inclusive).

    const targetDate = new Date(dateStr);
    targetDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone edge cases at midnight

    for (const block of blocks) {
        const start = new Date(block.start_date);
        const end = new Date(block.end_date);

        // Normalize block times to cover the full day if they are meant to be full-day blocks
        // But let's respect the API's returned range.

        if (targetDate >= start && targetDate <= end) {
            return block.reason;
        }

        // Double check specifically for date string match if timezones are tricky
        const blockStartStr = start.toISOString().split('T')[0];
        const blockEndStr = end.toISOString().split('T')[0];

        if (dateStr >= blockStartStr && dateStr <= blockEndStr) {
            return block.reason;
        }
    }

    return null;
};
