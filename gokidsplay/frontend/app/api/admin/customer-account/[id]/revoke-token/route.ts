import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

function getAdminToken() {
    return cookies().get("admin_token")?.value || "";
}

// DELETE /api/admin/customer-account/[id]/revoke-token/
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const token = getAdminToken();
    const res = await fetch(`${API}/bookings/customer-auth/admin/revoke-token/${params.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
