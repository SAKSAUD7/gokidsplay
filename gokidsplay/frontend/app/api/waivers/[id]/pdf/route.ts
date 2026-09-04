import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

// GET download waiver PDF
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = cookies().get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        console.log(`[Waiver PDF API] GET PDF for waiver ${params.id}`);

        const response = await fetch(`${API_URL}/bookings/waivers/${params.id}/download_pdf/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Waiver PDF API] Error:`, errorText);
            return NextResponse.json(
                { error: `Failed to download PDF`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[Waiver PDF API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
