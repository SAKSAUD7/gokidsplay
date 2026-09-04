import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        error: "This endpoint is deprecated. Please use Django admin to manage roles at http://localhost:9000/admin"
    }, { status: 410 });
}
