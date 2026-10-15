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

/** True for YouTube / Vimeo page links (as opposed to a direct video file). */
export const isVideoEmbed = (url: string | null | undefined): boolean =>
    !!url && /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(url);

/**
 * Convert a YouTube / Vimeo page link into an embeddable player URL.
 * `background: true` gives a muted, looping, control-less player for hero backgrounds.
 */
export const toEmbedUrl = (url: string, opts: { background?: boolean } = {}): string => {
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i);
    if (yt) {
        const id = yt[1];
        return opts.background
            ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1`
            : `https://www.youtube-nocookie.com/embed/${id}`;
    }
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeo) {
        return opts.background
            ? `https://player.vimeo.com/video/${vimeo[1]}?background=1&autoplay=1&loop=1&muted=1`
            : `https://player.vimeo.com/video/${vimeo[1]}`;
    }
    return url;
};
