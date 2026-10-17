import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace("localhost", "127.0.0.1");

/** One payment for Admin → Payments (staff only — forwards the admin_token cookie). */
export async function GET(_request: Request, { params }: { params: { paymentId: string } }) {
    const token = cookies().get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (!/^\d+$/.test(params.paymentId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    try {
        const res = await fetch(`${API_URL}/payments/${params.paymentId}/`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
