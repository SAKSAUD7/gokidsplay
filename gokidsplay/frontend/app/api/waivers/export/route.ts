import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

// GET export waivers as CSV
export async function GET(request: NextRequest) {
    try {
        const token = cookies().get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        console.log(`[Waivers Export API] GET CSV export`);

        const response = await fetch(`${API_URL}/bookings/waivers/export_csv/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Waivers Export API] Error:`, errorText);
            return NextResponse.json(
                { error: `Failed to export waivers`, details: errorText },
                { status: response.status }
            );
        }

        // Return the CSV blob
        const blob = await response.blob();
        return new NextResponse(blob, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="waivers_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error: any) {
        console.error('[Waivers Export API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
