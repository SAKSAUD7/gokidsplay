"use server";

import { cookies } from 'next/headers';

import { API_ENDPOINTS } from '@/lib/api-endpoints';

// Removed local API_URL as we use API_ENDPOINTS now

export async function uploadImage(formData: FormData) {
    try {
        const token = cookies().get('admin_token')?.value;

        if (!token) {
            console.error('[Upload] No admin token found');
            return { success: false, error: 'Not authenticated. Please login again.' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            console.error('[Upload] No file in FormData');
            return { success: false, error: 'No file provided' };
        }

        console.log('[Upload] Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

        // Convert File to Buffer (required for server-to-server FormData)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create new FormData for Django with proper Blob
        const backendFormData = new FormData();
        const blob = new Blob([buffer], { type: file.type });
        backendFormData.append('file', blob, file.name);

        console.log('[Upload] Sending to Django backend...');

        // Forward to Django backend
        const response = await fetch(API_ENDPOINTS.cms.upload, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: backendFormData,
        });

        console.log('[Upload] Django response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Upload] Django error:', errorText);

            let errorMessage = 'Upload failed';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            return { success: false, error: errorMessage };
        }

        const data = await response.json();
        console.log('[Upload] Success! URL:', data.url);

        return { success: true, url: data.url };
    } catch (error: any) {
        console.error('[Upload] Exception:', error);
        return {
            success: false,
            error: error.message || 'Upload failed. Please try again.'
        };
    }
}
