import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export async function GET(request: NextRequest) {
    const token = cookies().get("admin_token")?.value;
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/payments/${searchParams ? `?${searchParams}` : ""}`;

    try {
        const res = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch payments", status: res.status },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
