import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

/**
 * Attempt to silently refresh the access token.
 * Returns the new token string, or null if refresh failed (user must log in again).
 */
async function tryRefreshToken(request: NextRequest): Promise<string | null> {
    try {
        const refreshToken = cookies().get('admin_refresh_token')?.value;
        if (!refreshToken) return null;

        const baseUrl = API_URL.replace('/api/v1', '');
        const res = await fetch(`${baseUrl}/api/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
            cache: 'no-store',
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.access || null;
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        let token = cookies().get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated", detail: "Please log in to access this resource" },
                { status: 401 }
            );
        }

        // Get query parameters and pass them through
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type')?.toUpperCase() || 'SESSION';
        const activity = searchParams.get('activity');
        const page = searchParams.get('page') || '1';
        const pageSize = searchParams.get('page_size') || '50';
        const status = searchParams.get('status');
        const date = searchParams.get('date');
        const search = searchParams.get('search');

        // Build backend API URL
        let apiUrl: string;
        if (type === 'PARTY') {
            apiUrl = `${API_URL}/bookings/party-bookings/?ordering=-created_at&page=${page}&page_size=${pageSize}`;
        } else if (type === 'SESSION') {
            apiUrl = `${API_URL}/bookings/bookings/?type=SESSION&ordering=-created_at&page=${page}&page_size=${pageSize}`;
            if (activity) apiUrl += `&activity=${encodeURIComponent(activity)}`;
            if (status) apiUrl += `&status=${encodeURIComponent(status)}`;
            if (date) apiUrl += `&date=${encodeURIComponent(date)}`;
            if (search) apiUrl += `&search=${encodeURIComponent(search)}`;
        } else {
            return NextResponse.json(
                { error: "Use /api/bookings/all for combined bookings" },
                { status: 400 }
            );
        }

        // First attempt
        let response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        // If 401 (token expired) — silently try to refresh
        if (response.status === 401) {
            console.log('[API Route] Token expired, attempting silent refresh...');
            const newToken = await tryRefreshToken(request);

            if (!newToken) {
                // Refresh also failed — redirect to login
                return NextResponse.json(
                    { error: "Session expired", detail: "Please log in again" },
                    {
                        status: 401,
                        headers: { 'X-Redirect-To': '/admin/login' }
                    }
                );
            }

            // Retry with new token
            response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${newToken}`,
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            });

            // Build response and set the new token cookie
            if (response.ok) {
                const data = await response.json();
                const nextResponse = NextResponse.json(data);
                nextResponse.cookies.set('admin_token', newToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 8,
                    path: '/',
                    sameSite: 'lax',
                });
                return nextResponse;
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API Route] Backend error ${response.status}:`, errorText);
            return NextResponse.json(
                { error: `Backend API returned ${response.status}`, details: errorText, type },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[API Route] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
