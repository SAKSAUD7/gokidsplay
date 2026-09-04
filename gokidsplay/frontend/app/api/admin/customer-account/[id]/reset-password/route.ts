import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

function getAdminToken() {
    return cookies().get("admin_token")?.value || "";
}

// POST /api/admin/customer-account/[id]/reset-password/
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const token = getAdminToken();
    const body = await req.json();
    const res = await fetch(`${API}/bookings/customer-auth/admin/reset-password/${params.id}/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
