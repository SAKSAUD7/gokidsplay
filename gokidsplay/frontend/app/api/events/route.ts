import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1').replace('localhost', '127.0.0.1');

async function getAuthToken(request: NextRequest): Promise<string | null> {
    let token = cookies().get('admin_token')?.value;
    if (!token) return null;

    // Quick validation - try refresh if needed
    return token;
}

function buildHeaders(token: string) {
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// GET /api/events — list or single event
export async function GET(request: NextRequest) {
    const token = await getAuthToken(request);
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const id = sp.get('id');
    const slug = sp.get('slug');
    const subresource = sp.get('sub'); // e.g. "bookings", "stats"
    const status = sp.get('status');
    const event_type = sp.get('event_type');
    const search = sp.get('search');
    const publicList = sp.get('public') === '1';

    let url: string;
    if (publicList) {
        // Public events (no auth needed but proxied through)
        url = `${API_URL}/bookings/public/events/?`;
        if (event_type) url += `event_type=${event_type}&`;
    } else if (id && subresource) {
        url = `${API_URL}/bookings/events/${id}/${subresource}/`;
    } else if (id) {
        url = `${API_URL}/bookings/events/${id}/`;
    } else if (slug) {
        url = `${API_URL}/bookings/public/events/${slug}/`;
    } else {
        url = `${API_URL}/bookings/events/?ordering=date`;
        if (status) url += `&status=${status}`;
        if (event_type) url += `&event_type=${event_type}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url, { headers: buildHeaders(token), cache: 'no-store' });
    if (!res.ok) {
        const txt = await res.text();
        return NextResponse.json({ error: `Backend error ${res.status}`, detail: txt }, { status: res.status });
    }
    return NextResponse.json(await res.json());
}

// POST /api/events — create event or event action
export async function POST(request: NextRequest) {
    const token = await getAuthToken(request);
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const id = sp.get('id');
    const action = sp.get('action'); // publish | cancel | duplicate

    let url: string;
    if (id && action) {
        url = `${API_URL}/bookings/events/${id}/${action}/`;
    } else {
        url = `${API_URL}/bookings/events/`;
    }

    const body = await request.text();

    const res = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(token),
        body,
        cache: 'no-store',
    });

    if (!res.ok) {
        const txt = await res.text();
        return NextResponse.json({ error: `Backend error ${res.status}`, detail: txt }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('json')) {
        return NextResponse.json(await res.json());
    }
    return NextResponse.json({ success: true }, { status: res.status });
}

// PATCH /api/events?id=X — update event
export async function PATCH(request: NextRequest) {
    const token = await getAuthToken(request);
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await request.text();
    const res = await fetch(`${API_URL}/bookings/events/${id}/`, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body,
        cache: 'no-store',
    });

    if (!res.ok) {
        const txt = await res.text();
        return NextResponse.json({ error: `Backend error ${res.status}`, detail: txt }, { status: res.status });
    }
    return NextResponse.json(await res.json());
}

// DELETE /api/events?id=X — delete/cancel event
export async function DELETE(request: NextRequest) {
    const token = await getAuthToken(request);
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const res = await fetch(`${API_URL}/bookings/events/${id}/`, {
        method: 'DELETE',
        headers: buildHeaders(token),
        cache: 'no-store',
    });

    if (res.status === 204) return NextResponse.json({ success: true });
    if (!res.ok) {
        const txt = await res.text();
        return NextResponse.json({ error: `Backend error ${res.status}`, detail: txt }, { status: res.status });
    }
    return NextResponse.json({ success: true });
}
