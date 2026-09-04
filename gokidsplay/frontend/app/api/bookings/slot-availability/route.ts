import { NextRequest, NextResponse } from "next/server";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8005/api/v1").replace('localhost', '127.0.0.1');

/**
 * GET /api/bookings/slot-availability?date=YYYY-MM-DD
 * Proxies to Django: GET /api/v1/bookings/bookings/slot_availability/?date=...
 *
 * Returns Go Kids Play availability response:
 * {
 *   date, date_status, closure_reason,
 *   blocks_normal_bookings, blocks_party_bookings,
 *   session_capacity,
 *   slots: { "10:00": { slot_start, slot_end, status, booked_count, remaining_capacity, activity_availability } },
 *   party_slots: { "12:00": { ... } }
 * }
 */
export async function GET(req: NextRequest) {
    const date = req.nextUrl.searchParams.get("date");
    if (!date) {
        return NextResponse.json({ error: "date required" }, { status: 400 });
    }

    try {
        const res = await fetch(
            `${API_URL}/bookings/bookings/slot_availability/?date=${date}`,
            { cache: "no-store" }
        );
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch slot availability" }, { status: 500 });
    }
}
