import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1').replace('localhost', '127.0.0.1');

function buildHeaders(token: string) {
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function GET(request: NextRequest) {
    const token = cookies().get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const id = sp.get('id');
    const eventId = sp.get('event_id');
    const status = sp.get('status');
    const search = sp.get('search');

    let url = id
        ? `${API_URL}/bookings/event-bookings/${id}/`
        : `${API_URL}/bookings/event-bookings/?ordering=-created_at`;

    if (!id) {
        if (eventId) url += `&event_id=${eventId}`;
        if (status) url += `&status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url, { headers: buildHeaders(token), cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ error: `Backend error ${res.status}` }, { status: res.status });
    return NextResponse.json(await res.json());
}

export async function POST(request: NextRequest) {
    const sp = request.nextUrl.searchParams;
    const id = sp.get('id');
    const action = sp.get('action');

    // Public booking — no auth required
    if (!id && !action) {
        const body = await request.text();
        const res = await fetch(`${API_URL}/bookings/public/events/book/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            cache: 'no-store',
        });
        if (!res.ok) {
            const txt = await res.text();
            return NextResponse.json({ error: `Backend error ${res.status}`, detail: txt }, { status: res.status });
        }
        return NextResponse.json(await res.json());
    }

    const token = cookies().get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    if (id && action) {
        const body = await request.text();
        const res = await fetch(`${API_URL}/bookings/event-bookings/${id}/${action}/`, {
            method: 'POST',
            headers: buildHeaders(token),
            body,
            cache: 'no-store',
        });
        if (!res.ok) return NextResponse.json({ error: `Backend error ${res.status}` }, { status: res.status });
        return NextResponse.json(await res.json());
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
    const token = cookies().get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await request.text();
    const res = await fetch(`${API_URL}/bookings/event-bookings/${id}/`, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body,
        cache: 'no-store',
    });

    if (!res.ok) return NextResponse.json({ error: `Backend error ${res.status}` }, { status: res.status });
    return NextResponse.json(await res.json());
}
