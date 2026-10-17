import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace("localhost", "127.0.0.1");

/** Refund a payment (staff only — forwards the admin_token cookie). */
export async function POST(request: NextRequest) {
    const token = cookies().get("admin_token")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    try {
        const res = await fetch(`${API_URL}/payments/refund/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(await request.json()),
        });
        return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
