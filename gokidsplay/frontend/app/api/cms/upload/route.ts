
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

export async function POST(req: NextRequest) {
    console.log('[Upload Route] Request received');

    const token = cookies().get('admin_token')?.value;

    if (!token) {
        console.log('[Upload Route] No token found');
        return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
    }

    console.log('[Upload Route] Token found, processing upload');

    try {
        console.log('[Upload Route] Parsing FormData...');
        const formData = await req.formData();
        const file = formData.get('file');

        console.log('[Upload Route] File received:', file ? 'yes' : 'no');

        if (!file) {
            console.error('[Upload Route] No file in FormData');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log('[Upload Route] Forwarding to backend...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
            // Forward the original FormData directly
            const response = await fetch(`${API_URL}/cms/upload/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData, // Send original FormData
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            console.log('[Upload Route] Backend response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Upload Route] Upload failed:', response.status, errorText);
                return NextResponse.json(
                    { error: `Upload failed: ${response.statusText}` },
                    { status: response.status }
                );
            }

            const data = await response.json();
            console.log('[Upload Route] Upload successful, URL:', data.url);
            return NextResponse.json(data);

        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                console.error('[Upload Route] Upload timeout after 30 seconds');
                return NextResponse.json(
                    { error: 'Upload timeout - please try again' },
                    { status: 408 }
                );
            }
            console.error('[Upload Route] Fetch error:', fetchError);
            throw fetchError;
        }

    } catch (error: any) {
        console.error('[Upload Route] Upload proxy error:', error);
        return NextResponse.json(
            { error: `Internal server error: ${error.message}` },
            { status: 500 }
        );
    }
}
