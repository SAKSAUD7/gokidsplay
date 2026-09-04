import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = cookies().get("admin_token")?.value;
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

        const body = await request.json();

        const response = await fetch(`${API_URL}/bookings/booking-blocks/${params.id}/`, {
            method: 'PATCH',
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = cookies().get("admin_token")?.value;
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

        const response = await fetch(`${API_URL}/bookings/booking-blocks/${params.id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            return NextResponse.json(await response.json(), { status: response.status });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
