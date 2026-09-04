import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

export async function GET(request: NextRequest) {
    try {
        const token = cookies().get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Get query parameter to determine if we want unread only
        const searchParams = request.nextUrl.searchParams;
        const unreadOnly = searchParams.get('unread') === 'true';

        const apiUrl = unreadOnly
            ? `${API_URL}/core/notifications/unread/`
            : `${API_URL}/core/notifications/`;

        console.log(`[API Route] Fetching notifications: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API Route] Notifications error:`, errorText);
            return NextResponse.json(
                { error: `Failed to fetch notifications`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log(`[API Route] Loaded ${data.length || 0} notifications`);

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[API Route] Notifications error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = cookies().get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action, id } = body;

        let apiUrl: string;
        if (action === 'mark_read' && id) {
            apiUrl = `${API_URL}/core/notifications/${id}/mark_read/`;
        } else if (action === 'mark_all_read') {
            apiUrl = `${API_URL}/core/notifications/mark_all_read/`;
        } else {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `Failed to ${action}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
