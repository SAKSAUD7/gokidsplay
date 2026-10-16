import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1').replace('localhost', '127.0.0.1');

function adminHeaders() {
    const token = cookies().get('admin_token')?.value;
    if (!token) return null;
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function relay(res: Response) {
    if (res.status === 204) return NextResponse.json({ success: true });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { error: text || `Backend error ${res.status}` }; }
    return NextResponse.json(data, { status: res.status });
}

// GET /api/event-requests — admin list (optional ?status= & ?search=)
export async function GET(request: NextRequest) {
    const headers = adminHeaders();
    if (!headers) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sp = request.nextUrl.searchParams;
    const qs = new URLSearchParams();
    if (sp.get('status')) qs.set('status', sp.get('status')!);
    if (sp.get('search')) qs.set('search', sp.get('search')!);
    const res = await fetch(`${API_URL}/bookings/event-requests/?${qs}`, { headers, cache: 'no-store' });
    return relay(res);
}

// POST /api/event-requests — public "Request an Event" form
export async function POST(request: NextRequest) {
    const res = await fetch(`${API_URL}/bookings/public/events/request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: await request.text(),
        cache: 'no-store',
    });
    return relay(res);
}

// PATCH /api/event-requests?id=X — admin updates status / notes
export async function PATCH(request: NextRequest) {
    const headers = adminHeaders();
    if (!headers) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const id = request.nextUrl.searchParams.get('id');
    if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const res = await fetch(`${API_URL}/bookings/event-requests/${id}/`, {
        method: 'PATCH', headers, body: await request.text(), cache: 'no-store',
    });
    return relay(res);
}

// DELETE /api/event-requests?id=X — admin removes a request
export async function DELETE(request: NextRequest) {
    const headers = adminHeaders();
    if (!headers) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const id = request.nextUrl.searchParams.get('id');
    if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const res = await fetch(`${API_URL}/bookings/event-requests/${id}/`, { method: 'DELETE', headers, cache: 'no-store' });
    return relay(res);
}
