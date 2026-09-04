import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export async function POST(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    const token = cookies().get("admin_token")?.value;
    const { orderId } = params;

    try {
        const res = await fetch(`${BACKEND_URL}/payments/reverify/${orderId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { error: data.error || "Re-verify failed" },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
