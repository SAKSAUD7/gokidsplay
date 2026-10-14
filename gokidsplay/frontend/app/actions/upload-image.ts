'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
}

export async function uploadImage(formData: FormData) {
    try {
        const r = await fetch(`${BASE}/cms/gallery/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData,
            cache: 'no-store',
        });
        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            return { success: false, error: err?.detail || 'Upload failed' };
        }
        const data = await r.json();
        return { success: true, data };
    } catch(e: any) {
        return { success: false, error: e.message || 'Network error' };
    }
}

export async function uploadMedia(endpoint: string, formData: FormData) {
    try {
        const r = await fetch(`${BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData,
            cache: 'no-store',
        });
        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            return { success: false, error: err?.detail || 'Upload failed' };
        }
        const data = await r.json();
        return { success: true, data };
    } catch(e: any) {
        return { success: false, error: e.message || 'Network error' };
    }
}
