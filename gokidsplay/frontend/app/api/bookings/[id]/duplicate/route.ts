import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const token = cookies().get("admin_token")?.value;
    const body = await request.json();

    try {
        const apiUrl = `${BACKEND_URL}/bookings/bookings/${id}/duplicate/`;

        const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return NextResponse.json(
                { error: errData.error || errData.detail || "Failed to duplicate booking" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
