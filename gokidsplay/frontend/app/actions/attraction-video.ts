'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[attraction-video]', r.status); return null; }
        return r.json();
    } catch(e) { console.error('[attraction-video] error:', e); return null; }
}

export async function getAttractionVideos() {
    const data = await sf(`${BASE}/cms/attraction-videos/`);
    if (!data) return [];
    return Array.isArray(data) ? data.filter((v: any) => v.active !== false) : (data.results || []);
}

export async function getAttractionVideo(slug: string) {
    const data = await sf(`${BASE}/cms/attraction-videos/?slug=${slug}`);
    if (!data) return null;
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.find((v: any) => v.slug === slug) || null;
}
