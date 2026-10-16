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
        // Pass the API's own message through (e.g. "Only 5 places available")
        const text = await res.text();
        let data: any;
        try { data = JSON.parse(text); } catch { data = { error: 'Sorry, something went wrong. Please try again.' }; }
        return NextResponse.json(data, { status: res.status });
    }

    const token = cookies().get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    if (id && action) {
        // Only the reservation actions the API offers
        const ACTIONS = ['mark-paid', 'mark-unpaid', 'confirm', 'cancel', 'reinstate', 'mark-arrived', 'mark-no-show'];
        if (!/^\d+$/.test(id) || !ACTIONS.includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }
        const body = await request.text();
        const res = await fetch(`${API_URL}/bookings/event-bookings/${id}/${action}/`, {
            method: 'POST',
            headers: buildHeaders(token),
            body,
            cache: 'no-store',
        });
        const text = await res.text();
        let data: any;
        try { data = JSON.parse(text); } catch { data = { error: `Backend error ${res.status}` }; }
        return NextResponse.json(data, { status: res.status });
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
