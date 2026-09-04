import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

export async function GET() {
    try {
        // Read the httpOnly admin_token cookie server-side
        const token = cookies().get("admin_token")?.value;

        if (!token) {
            console.error('[PaymentStats API Route] No authentication token found');
            return NextResponse.json(
                { error: "Not authenticated", detail: "Please log in to access this resource" },
                { status: 401 }
            );
        }

        console.log('[PaymentStats API Route] Fetching payment stats from backend');

        const response = await fetch(`${API_URL}/payments/stats/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[PaymentStats API Route] Backend error ${response.status}:`, errorText);
            return NextResponse.json(
                { error: `Backend API returned ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[PaymentStats API Route] Successfully fetched payment stats');
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[PaymentStats API Route] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
