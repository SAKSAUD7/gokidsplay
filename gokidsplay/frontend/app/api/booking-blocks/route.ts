import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

export async function GET(request: NextRequest) {
    try {
        const token = cookies().get("admin_token")?.value;
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.toString();
        const url = `${API_URL}/bookings/booking-blocks/${query ? `?${query}` : ''}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({ error: await response.text() }, { status: response.status });
        }

        return NextResponse.json(await response.json());
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = cookies().get("admin_token")?.value;
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

        const body = await request.json();

        const response = await fetch(`${API_URL}/bookings/booking-blocks/`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return NextResponse.json(await response.json(), { status: response.status });
        }

        return NextResponse.json(await response.json());
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
