import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

/**
 * POST /api/auth/refresh
 * Silently renew the admin access token using the stored refresh token.
 * Returns { ok: true } on success, { ok: false } if the refresh token is also expired.
 */
export async function POST() {
    try {
        const refreshToken = cookies().get('admin_refresh_token')?.value;

        if (!refreshToken) {
            return NextResponse.json({ ok: false, reason: 'no_refresh_token' }, { status: 401 });
        }

        const baseUrl = API_URL.replace('/api/v1', '');
        const res = await fetch(`${baseUrl}/api/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
            cache: 'no-store',
        });

        if (!res.ok) {
            // Refresh token is also expired — user must log in again
            return NextResponse.json({ ok: false, reason: 'refresh_expired' }, { status: 401 });
        }

        const data = await res.json();
        const newAccessToken = data.access;

        // Update the access token cookie
        const response = NextResponse.json({ ok: true });
        response.cookies.set('admin_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 8, // 8 hours
            path: '/',
            sameSite: 'lax',
        });

        return response;
    } catch (error: any) {
        console.error('[Auth Refresh] Error:', error);
        return NextResponse.json({ ok: false, reason: 'error', message: error.message }, { status: 500 });
    }
}
