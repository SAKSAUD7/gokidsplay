/**
 * Utility functions for handling media URLs from the backend
 */

export const getMediaUrl = (path: string | null | undefined): string => {
    if (!path) return '';

    // Already an absolute URL — return directly
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Local frontend public assets — served by Next.js, not backend
    // e.g. /images/gokidsplay/..., /gokidsplay-logo.png, /icons/...
    const frontendPaths = ['/images/', '/icons/', '/gokidsplay-logo.png', '/fonts/'];
    if (frontendPaths.some(prefix => path.startsWith(prefix) || path === prefix.slice(0, -1))) {
        return path; // return as-is; Next.js serves from /public
    }

    // Backend media paths — proxy through backend (Django)
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';
    const API_ROOT = API_BASE_URL.replace('/api/v1', '');

    if (path.startsWith('/')) {
        return `${API_ROOT}${path}`;
    }

    return `${API_ROOT}/${path}`;
};
