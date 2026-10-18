import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1";

export async function GET(
    request: NextRequest,
    { params }: { params: { bookingId: string; bookingType: string } }
) {
    try {
        const { bookingId, bookingType } = params;
        
        // Staff only: send the admin's token
        const token = cookies().get("admin_token")?.value;
        if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        if (!/^\d+$/.test(bookingId) || !["session", "party"].includes(bookingType)) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const response = await fetch(`${API_BASE_URL}/payments/booking/${bookingId}/${bookingType}/status/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Backend returned ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Payment status proxy error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
