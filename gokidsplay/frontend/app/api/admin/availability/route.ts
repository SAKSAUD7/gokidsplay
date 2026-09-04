import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8005/api/v1').replace('localhost', '127.0.0.1');

/**
 * GET /api/admin/availability?date=YYYY-MM-DD
 * Admin-only: full availability for a specific date (for Availability Control Panel)
 */
export async function GET(request: NextRequest) {
    try {
        const token = cookies().get('admin_token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const date = request.nextUrl.searchParams.get('date');
        if (!date) {
            return NextResponse.json({ error: 'date parameter required' }, { status: 400 });
        }

        const response = await fetch(`${API_URL}/bookings/calendar/availability/?date=${date}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/availability
 * Admin-only: create/update a BookingBlock (date override)
 * Body: { date, type, reason, blocks_normal_bookings, blocks_party_bookings }
 */
export async function POST(request: NextRequest) {
    try {
        const token = cookies().get('admin_token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();

        const response = await fetch(`${API_URL}/bookings/booking-blocks/`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/availability?block_id=N
 * Admin-only: remove a BookingBlock (reset date to calendar default)
 */
export async function DELETE(request: NextRequest) {
    try {
        const token = cookies().get('admin_token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const blockId = request.nextUrl.searchParams.get('block_id');
        if (!blockId) {
            return NextResponse.json({ error: 'block_id parameter required' }, { status: 400 });
        }

        const response = await fetch(`${API_URL}/bookings/booking-blocks/${blockId}/`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 204) {
            return NextResponse.json({ success: true });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
