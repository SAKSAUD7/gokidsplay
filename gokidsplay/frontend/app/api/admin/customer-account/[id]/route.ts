import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

function getAdminToken() {
    return cookies().get("admin_token")?.value || "";
}

// GET /api/admin/customer-account/[id]/ — view account details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const token = getAdminToken();
    const res = await fetch(`${API}/bookings/customer-auth/admin/account/${params.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
