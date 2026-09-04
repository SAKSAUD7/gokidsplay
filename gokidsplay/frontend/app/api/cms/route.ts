import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

// Comprehensive CMS API proxy to handle all CMS operations
export async function GET(request: NextRequest) {
    try {
        const token = cookies().get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Get the endpoint from query params
        const searchParams = request.nextUrl.searchParams;
        const endpoint = searchParams.get('endpoint');

        if (!endpoint) {
            return NextResponse.json(
                { error: "Endpoint parameter required" },
                { status: 400 }
            );
        }

        console.log(`[CMS API] GET ${endpoint}`);

        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[CMS API] Error:`, errorText);
            return NextResponse.json(
                { error: `Failed to fetch ${endpoint}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[CMS API] Error:', error);
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
        const { endpoint, data } = body;

        if (!endpoint) {
            return NextResponse.json(
                { error: "Endpoint parameter required" },
                { status: 400 }
            );
        }

        console.log(`[CMS API] POST ${endpoint}`);

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[CMS API] Error:`, errorText);
            return NextResponse.json(
                { error: `Failed to post to ${endpoint}`, details: errorText },
                { status: response.status }
            );
        }

        const responseData = await response.json();
        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('[CMS API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const token = cookies().get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { endpoint, data } = body;

        if (!endpoint) {
            return NextResponse.json(
                { error: "Endpoint parameter required" },
                { status: 400 }
            );
        }

        console.log(`[CMS API] PUT ${endpoint}`);

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[CMS API] Error:`, errorText);
            return NextResponse.json(
                { error: `Failed to update ${endpoint}`, details: errorText },
                { status: response.status }
            );
        }

        const responseData = await response.json();
        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('[CMS API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const token = cookies().get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { endpoint, data } = body;

        if (!endpoint) {
            return NextResponse.json(
                { error: "Endpoint parameter required" },
                { status: 400 }
            );
        }

        console.log(`[CMS API] PATCH ${endpoint}`);

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[CMS API] Error:`, errorText);
            return NextResponse.json(
                { error: `Failed to patch ${endpoint}`, details: errorText },
                { status: response.status }
            );
        }

        const responseData = await response.json();
        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('[CMS API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const token = cookies().get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const endpoint = searchParams.get('endpoint');

        if (!endpoint) {
            return NextResponse.json(
                { error: "Endpoint parameter required" },
                { status: 400 }
            );
        }

        console.log(`[CMS API] DELETE ${endpoint}`);

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok && response.status !== 204) {
            const errorText = await response.text();
            console.error(`[CMS API] Error:`, errorText);
            return NextResponse.json(
                { error: `Failed to delete ${endpoint}`, details: errorText },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[CMS API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
