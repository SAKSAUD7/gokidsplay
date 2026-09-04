import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

export async function GET(request: NextRequest) {
    try {
        const token = cookies().get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const start_date = searchParams.get('start_date');
        const end_date = searchParams.get('end_date');

        // Build API URL with query params
        const apiUrl = `${API_URL}/bookings/calendar/?start_date=${start_date}&end_date=${end_date}`;

        console.log(`[API Route] Fetching calendar bookings: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API Route] Calendar error:`, errorText);
            return NextResponse.json(
                { error: `Failed to fetch calendar data`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log(`[API Route] Calendar loaded: ${data.events?.length || 0} events`);

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[API Route] Calendar error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
