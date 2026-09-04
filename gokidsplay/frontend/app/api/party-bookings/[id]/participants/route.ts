import { NextRequest, NextResponse } from 'next/server';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

// POST add participants to party booking
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        console.log(`[Party Participants API] POST participants for booking ${params.id}`);

        const authHeader = request.headers.get('authorization');
        
        const response = await fetch(`${API_URL}/bookings/party-bookings/${params.id}/add_participants/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { 'Authorization': authHeader } : {})
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Party Participants API] Error:`, errorText);
            return NextResponse.json(
                { error: `Failed to add participants`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[Party Participants API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
