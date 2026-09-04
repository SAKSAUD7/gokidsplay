import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const token = cookies().get('admin_token')?.value;
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

    try {
        // Parse the incoming form data
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file found in request' }, { status: 400 });
        }

        // Create a new FormData instance for the backend request
        const backendFormData = new FormData();
        backendFormData.append('file', file);

        // Forward to Django
        const response = await fetch(`${API_URL}/cms/upload/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // CAUTION: Do NOT set Content-Type header manually when using FormData
                // fetch will automatically set it to multipart/form-data with the correct boundary
            },
            body: backendFormData,
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Backend upload failed:', text);
            // Try to parse JSON error if possible
            try {
                const jsonError = JSON.parse(text);
                return NextResponse.json({ error: jsonError.detail || jsonError.error || text }, { status: response.status });
            } catch (e) {
                return NextResponse.json({ error: 'Backend upload failed: ' + text.substring(0, 100) }, { status: response.status });
            }
        }

        const data = await response.json();
        return NextResponse.json({ success: true, url: data.url });
    } catch (error: any) {
        console.error('Upload proxy error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
