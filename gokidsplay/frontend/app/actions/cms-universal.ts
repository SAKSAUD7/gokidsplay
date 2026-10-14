'use server';

/**
 * Universal CMS action wrapper — maps a slug to an API endpoint.
 * Used by generic CMS admin pages to avoid duplicate boilerplate.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

const SLUG_MAP: Record<string, string> = {
    'banners': '/cms/banners/',
    'activities': '/cms/activities/',
    'gallery': '/cms/gallery/',
    'party-packages': '/cms/party-packages/',
    'pricing-plans': '/cms/pricing-plans/',
    'group-packages': '/cms/group-packages/',
    'menu-sections': '/cms/menu-sections/',
    'page-sections': '/cms/page-sections/',
    'stat-cards': '/cms/stat-cards/',
    'social-links': '/cms/social-links/',
    'guideline-categories': '/cms/guideline-categories/',
    'timeline-items': '/cms/timeline-items/',
    'value-items': '/cms/value-items/',
    'facility-items': '/cms/facility-items/',
    'timing-cards': '/cms/timing-cards/',
    'instagram-reels': '/cms/instagram-reels/',
    'faqs': '/cms/faqs/',
    'booking-information': '/cms/booking-information/',
    'contact-info': '/cms/contact-info/',
    'group-benefits': '/cms/group-benefits/',
    'legal-documents': '/cms/legal-documents/',
};

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[cms-universal]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[cms-universal] error:', e); return null; }
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
}

export async function cmsGetAll(slug: string) {
    const path = SLUG_MAP[slug];
    if (!path) return [];
    const data = await sf(`${BASE}${path}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function cmsCreate(slug: string, data: any) {
    const path = SLUG_MAP[slug];
    if (!path) return null;
    return sf(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(data),
    });
}

export async function cmsUpdate(slug: string, id: number, data: any) {
    const path = SLUG_MAP[slug];
    if (!path) return null;
    return sf(`${BASE}${path}${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(data),
    });
}

export async function cmsDelete(slug: string, id: number) {
    const path = SLUG_MAP[slug];
    if (!path) return false;
    const r = await fetch(`${BASE}${path}${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        cache: 'no-store',
    });
    return r.ok;
}
