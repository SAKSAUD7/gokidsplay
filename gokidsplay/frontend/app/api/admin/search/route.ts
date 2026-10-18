import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace("localhost", "127.0.0.1");

/**
 * Admin header search (GlobalSearch). Runs on the server so the admin's
 * httpOnly sign-in goes with it — works when the API is on another domain.
 */
export async function GET(request: NextRequest) {
    const token = cookies().get("admin_token")?.value;
    if (!token) return NextResponse.json({ results: [], error: "Not signed in" }, { status: 401 });
    const q = request.nextUrl.searchParams.get("q") || "";
    try {
        const res = await fetch(`${API_URL}/core/admin/search/?q=${encodeURIComponent(q)}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        return NextResponse.json(await res.json().catch(() => ({ results: [] })), { status: res.status });
    } catch {
        return NextResponse.json({ results: [], error: "Search is unavailable" }, { status: 502 });
    }
}
