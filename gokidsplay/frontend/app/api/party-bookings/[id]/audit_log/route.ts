import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const token = cookies().get("admin_token")?.value;

    try {
        const apiUrl = `${BACKEND_URL}/bookings/party-bookings/${id}/audit_log/`;

        const res = await fetch(apiUrl, {
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to fetch audit log" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
