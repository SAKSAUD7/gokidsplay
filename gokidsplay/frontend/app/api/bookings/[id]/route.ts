import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const token = cookies().get("admin_token")?.value;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type')?.toUpperCase() || 'SESSION';

    try {
        // Build URL based on booking type
        let apiUrl: string;
        if (type === 'PARTY') {
            apiUrl = `${BACKEND_URL}/bookings/party-bookings/${id}/`;
        } else {
            apiUrl = `${BACKEND_URL}/bookings/bookings/${id}/`;
        }

        const res = await fetch(apiUrl, {
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch booking" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const token = cookies().get("admin_token")?.value;
    const body = await request.json();
    const type = body.type?.toUpperCase() || 'SESSION';

    // Strip frontend-only helper field before sending to backend
    const { type: _type, ...backendBody } = body;

    try {
        let apiUrl: string;
        if (type === 'PARTY') {
            apiUrl = `${BACKEND_URL}/bookings/party-bookings/${id}/`;
        } else {
            apiUrl = `${BACKEND_URL}/bookings/bookings/${id}/`;
        }

        // booking_status and payment_status are read-only fields — update them directly
        // via a dedicated admin status-update endpoint
        if (backendBody.booking_status || backendBody.payment_status || backendBody.status) {
            const statusUrl = type === 'PARTY'
                ? `${BACKEND_URL}/bookings/party-bookings/${id}/update_status/`
                : `${BACKEND_URL}/bookings/bookings/${id}/update_status/`;
            
            // For party bookings, frontend sometimes sends `status` instead of `booking_status`
            const bStatus = backendBody.booking_status || backendBody.status;

            const statusRes = await fetch(statusUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({ 
                    booking_status: bStatus,
                    payment_status: backendBody.payment_status
                }),
            });

            if (statusRes.ok) {
                // Fetch fresh booking data to return updated state
                const freshRes = await fetch(apiUrl, {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    cache: "no-store",
                });
                const freshData = await freshRes.json();
                return NextResponse.json(freshData);
            }

            // Fallback: try direct PATCH with booking_status field
        }

        const res = await fetch(apiUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(backendBody),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`Booking PATCH failed (${res.status}):`, errText);
            return NextResponse.json(
                { error: "Failed to update booking", detail: errText },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Booking PATCH error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
