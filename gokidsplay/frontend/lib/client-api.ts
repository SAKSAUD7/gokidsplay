// Client-side API helper for admin portal
// This runs in the browser and can access cookies via document.cookie

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

function getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    console.log('[AUTH] All cookies:', document.cookie);

    // Try multiple possible cookie names
    const possibleNames = ['admin_token', 'token', 'auth_token', 'access_token'];

    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        console.log('[AUTH] Checking cookie:', name);

        if (possibleNames.includes(name)) {
            const token = decodeURIComponent(value);
            console.log('[AUTH] Found token with name:', name);
            return token;
        }
    }

    console.warn('[AUTH] No authentication token found in cookies');
    return null;
}

export async function fetchBookingsClient(type: 'SESSION' | 'PARTY' = 'SESSION') {
    const token = getTokenFromCookie();

    console.log('[CLIENT] Token exists:', !!token);
    console.log('[CLIENT] Fetching type:', type);

    let url: string;

    if (type === 'PARTY') {
        // Party bookings use a different endpoint
        url = `${API_URL}/bookings/party-bookings/`;
    } else {
        // Session bookings use the standard endpoint with type filter
        const params = new URLSearchParams();
        params.append('type', type);
        params.append('ordering', '-created_at');
        url = `${API_URL}/bookings/bookings/?${params.toString()}`;
    }

    console.log('[CLIENT] Fetching:', url);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            headers,
            credentials: 'include',
            cache: 'no-store',
        });

        console.log('[CLIENT] Response status:', response.status);
        console.log('[CLIENT] Response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[CLIENT] Error response:', errorText);
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('[CLIENT] Data received:', data);
        console.log('[CLIENT] Data length:', Array.isArray(data) ? data.length : 'not an array');

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('[CLIENT] Fetch error:', error);
        throw error;
    }
}

export async function fetchAllBookingsClient() {
    try {
        // Fetch both session and party bookings in parallel
        const [sessionBookings, partyBookings] = await Promise.all([
            fetchBookingsClient('SESSION'),
            fetchBookingsClient('PARTY')
        ]);

        console.log('[CLIENT] Session bookings:', sessionBookings.length);
        console.log('[CLIENT] Party bookings:', partyBookings.length);

        // Combine and sort by created_at
        const allBookings = [...sessionBookings, ...partyBookings].sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        console.log('[CLIENT] All bookings:', allBookings.length, 'total');
        return allBookings;
    } catch (error) {
        console.error('[CLIENT] Error fetching all bookings:', error);
        throw error;
    }
}

export async function markBookingArrived(bookingId: number) {
    const url = `${API_URL}/bookings/bookings/${bookingId}/mark_arrived/`;
    console.log('[CLIENT] Marking booking as arrived:', url);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // This sends the httpOnly cookie automatically
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[CLIENT] Mark arrived failed:', response.status, errorText);
            throw new Error(`Failed to mark arrived: ${response.status}`);
        }

        const data = await response.json();
        console.log('[CLIENT] Marked as arrived:', data);
        return data;
    } catch (error) {
        console.error('[CLIENT] Error marking arrived:', error);
        throw error;
    }
}

export async function markPartyBookingArrived(bookingId: number) {
    const url = `${API_URL}/bookings/party-bookings/${bookingId}/mark_arrived/`;
    console.log('[CLIENT] Marking party booking as arrived:', url);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // This sends the httpOnly cookie automatically
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[CLIENT] Mark party arrived failed:', response.status, errorText);
            throw new Error(`Failed to mark party arrived: ${response.status}`);
        }

        const data = await response.json();
        console.log('[CLIENT] Party marked as arrived:', data);
        return data;
    } catch (error) {
        console.error('[CLIENT] Error marking party arrived:', error);
        throw error;
    }
}

