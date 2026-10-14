'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[cms]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[cms] error:', e); return null; }
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';
}

function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

// ── PAGES ─────────────────────────────────────────────────────────────────
export async function getPages() {
    const data = await sf(`${BASE}/cms/pages/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function updatePage(id: number | string, data: any) {
    return sf(`${BASE}/cms/pages/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

// ── STATIC PAGES ──────────────────────────────────────────────────────────
export async function getStaticPages() {
    const data = await sf(`${BASE}/cms/static-pages/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getStaticPage(slug: string) {
    const data = await sf(`${BASE}/cms/static-pages/?slug=${slug}`, { headers: authHeaders() });
    if (!data) return null;
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.find((p: any) => p.slug === slug) || null;
}

export async function createStaticPage(data: any) {
    return sf(`${BASE}/cms/static-pages/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateStaticPage(id: number | string, data: any) {
    return sf(`${BASE}/cms/static-pages/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteStaticPage(id: number | string) {
    const r = await fetch(`${BASE}/cms/static-pages/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── FREE ENTRIES ──────────────────────────────────────────────────────────
export async function getFreeEntries(params?: { page?: number; status?: string }) {
    let url = `${BASE}/bookings/free-entries/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function createFreeEntry(data: any) {
    return sf(`${BASE}/bookings/free-entries/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateFreeEntryStatus(id: number | string, status: string) {
    return sf(`${BASE}/bookings/free-entries/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
}

export async function deleteFreeEntry(id: number | string) {
    const r = await fetch(`${BASE}/bookings/free-entries/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── PRODUCTS (Shop) ───────────────────────────────────────────────────────
export async function getProducts() {
    const data = await sf(`${BASE}/shop/products/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getProduct(id: number | string) {
    return sf(`${BASE}/shop/products/${id}/`, { headers: authHeaders() });
}

export async function createProduct(data: any) {
    return sf(`${BASE}/shop/products/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateProduct(id: number | string, data: any) {
    return sf(`${BASE}/shop/products/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteProduct(id: number | string) {
    const r = await fetch(`${BASE}/shop/products/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── CMS OVERVIEW ──────────────────────────────────────────────────────────
export async function getCMSOverview() {
    const [pages, sections, gallery] = await Promise.all([
        sf(`${BASE}/cms/pages/`, { headers: authHeaders() }),
        sf(`${BASE}/cms/page-sections/`, { headers: authHeaders() }),
        sf(`${BASE}/cms/gallery/`, { headers: authHeaders() }),
    ]);
    return {
        pages: pages ? (Array.isArray(pages) ? pages : pages.results || []) : [],
        sections: sections ? (Array.isArray(sections) ? sections : sections.results || []) : [],
        gallery: gallery ? (Array.isArray(gallery) ? gallery : gallery.results || []) : [],
    };
}

// ── UNIVERSAL CMS SLUG MAP ────────────────────────────────────────────────
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
    'products': '/shop/products/',
};

export async function cmsGetAll(slug: string) {
    const path = SLUG_MAP[slug];
    if (!path) return [];
    const data = await sf(`${BASE}${path}`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function cmsCreate(slug: string, data: any) {
    const path = SLUG_MAP[slug];
    if (!path) return null;
    return sf(`${BASE}${path}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function cmsUpdate(slug: string, id: number, data: any) {
    const path = SLUG_MAP[slug];
    if (!path) return null;
    return sf(`${BASE}${path}${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function cmsDelete(slug: string, id: number) {
    const path = SLUG_MAP[slug];
    if (!path) return false;
    const r = await fetch(`${BASE}${path}${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}
