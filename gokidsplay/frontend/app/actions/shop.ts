'use server';
import { cookies } from 'next/headers';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[shop]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[shop] error:', e); return null; }
}

function getToken() {
    return cookies().get('admin_token')?.value || '';
}

export async function getProducts(params?: { category?: string; in_stock?: boolean }) {
    let url = `${BASE}/shop/products/`;
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.in_stock !== undefined) qs.set('in_stock', String(params.in_stock));
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url);
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getProduct(id: number | string) {
    return sf(`${BASE}/shop/products/${id}/`);
}

export async function createProduct(data: any) {
    return sf(`${BASE}/shop/products/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
    });
}

export async function updateProduct(id: number | string, data: any) {
    return sf(`${BASE}/shop/products/${id}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
    });
}

export async function deleteProduct(id: number | string) {
    const r = await fetch(`${BASE}/shop/products/${id}/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
        },
        cache: 'no-store',
    });
    return r.ok;
}

export async function getMembershipPlans() {
    const data = await sf(`${BASE}/shop/membership-plans/`);
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}
