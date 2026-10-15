/**
 * Upload a file from an admin page in the browser. Goes through the
 * /api/cms/video-upload route handler (forwards the httpOnly admin cookie,
 * no 1MB server-action body limit). Returns the same shape as the old
 * `uploadImage` server action so existing callers keep working.
 */
export async function uploadMediaFile(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const res = await fetch('/api/cms/video-upload', { method: 'POST', body: formData });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) return { success: true, url: data.url };
        return { success: false, error: data.error || `Upload failed (${res.status})` };
    } catch (e: any) {
        return { success: false, error: e?.message || 'Upload failed' };
    }
}
