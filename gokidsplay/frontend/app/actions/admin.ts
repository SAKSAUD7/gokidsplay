'use server';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1';

async function sf(url: string, init: RequestInit = {}) {
    try {
        const r = await fetch(url, { ...init, cache: 'no-store' });
        if (!r.ok) { console.error('[admin]', r.status, url); return null; }
        return r.json();
    } catch(e) { console.error('[admin] error:', e); return null; }
}

function getToken() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('admin_token') || '';
    }
    return '';
}

function authHeaders(extra?: Record<string, string>) {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}`, ...extra };
}

// ── AUTH ──────────────────────────────────────────────────────────────────
export async function adminLogin(email: string, password: string) {
    try {
        const r = await fetch(`${BASE.replace('/api/v1', '')}/api/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            cache: 'no-store',
        });
        const json = await r.json();
        if (!r.ok) return { success: false, error: json?.detail || 'Login failed' };
        return { success: true, access: json.access, refresh: json.refresh };
    } catch(e: any) {
        return { success: false, error: e.message || 'Network error' };
    }
}

export async function verifyToken(token: string) {
    try {
        const r = await fetch(`${BASE.replace('/api/v1', '')}/api/token/verify/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            cache: 'no-store',
        });
        return r.ok;
    } catch { return false; }
}

export async function refreshToken(refresh: string) {
    try {
        const r = await fetch(`${BASE.replace('/api/v1', '')}/api/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
            cache: 'no-store',
        });
        const json = await r.json();
        if (!r.ok) return null;
        return json.access;
    } catch { return null; }
}

export async function getAdminProfile() {
    return sf(`${BASE}/core/users/me/`, { headers: authHeaders() });
}

// ── BOOKINGS ─────────────────────────────────────────────────────────────
export async function getAllBookings(params?: { page?: number; status?: string; search?: string; type?: string }) {
    let url = `${BASE}/bookings/bookings/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.type) qs.set('type', params.type);
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function getSessionBookings(params?: { page?: number; date?: string; status?: string; search?: string }) {
    let url = `${BASE}/bookings/bookings/`;
    const qs = new URLSearchParams();
    qs.set('type', 'SESSION');
    if (params?.page) qs.set('page', String(params.page));
    if (params?.date) qs.set('date', params.date);
    if (params?.status) qs.set('booking_status', params.status);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function getBookingById(id: number | string) {
    return sf(`${BASE}/bookings/bookings/${id}/`, { headers: authHeaders() });
}

export async function updateBookingStatus(id: number | string, status: string, notes?: string) {
    return sf(`${BASE}/bookings/bookings/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ booking_status: status, ...(notes ? { notes } : {}) }),
    });
}

export async function updatePartyBookingStatus(id: number | string, status: string) {
    return sf(`${BASE}/bookings/party-bookings/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ booking_status: status }),
    });
}

export async function toggleBookingArrival(id: number | string, arrived: boolean) {
    return sf(`${BASE}/bookings/bookings/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ arrived }),
    });
}

export async function getPartyBookings(params?: { page?: number; status?: string; search?: string }) {
    let url = `${BASE}/bookings/party-bookings/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function getPartyBookingById(id: number | string) {
    return sf(`${BASE}/bookings/party-bookings/${id}/`, { headers: authHeaders() });
}

export async function getDashboardStats() {
    return sf(`${BASE}/bookings/dashboard-stats/`, { headers: authHeaders() });
}

export async function getCustomers(params?: { page?: number; search?: string }) {
    let url = `${BASE}/bookings/customers/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}

// ── BOOKING BLOCKS ────────────────────────────────────────────────────────
export async function getBookingBlocks() {
    const data = await sf(`${BASE}/bookings/booking-blocks/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createBookingBlock(data: any) {
    return sf(`${BASE}/bookings/booking-blocks/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateBookingBlock(id: number | string, data: any) {
    return sf(`${BASE}/bookings/booking-blocks/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteBookingBlock(id: number | string) {
    const r = await fetch(`${BASE}/bookings/booking-blocks/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── LOGS ──────────────────────────────────────────────────────────────────
export async function getAuditLogs(params?: { page?: number; action?: string; search?: string }) {
    let url = `${BASE}/core/logs/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.action) qs.set('action', params.action);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function getLogStats() {
    return sf(`${BASE}/core/logs/stats/`, { headers: authHeaders() });
}

// ── BANNERS ───────────────────────────────────────────────────────────────
export async function getBanners() {
    const data = await sf(`${BASE}/cms/banners/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getBanner(id: number | string) {
    return sf(`${BASE}/cms/banners/${id}/`, { headers: authHeaders() });
}

export async function createBanner(data: any) {
    return sf(`${BASE}/cms/banners/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateBanner(id: number | string, data: any) {
    return sf(`${BASE}/cms/banners/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteBanner(id: number | string) {
    const r = await fetch(`${BASE}/cms/banners/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── CONTACT MESSAGES ──────────────────────────────────────────────────────
export async function getContactMessages(params?: { page?: number; is_read?: boolean }) {
    let url = `${BASE}/cms/contact-messages/`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.is_read !== undefined) qs.set('is_read', String(params.is_read));
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function getContactMessage(id: number | string) {
    return sf(`${BASE}/cms/contact-messages/${id}/`, { headers: authHeaders() });
}

export async function markMessageAsRead(id: number | string) {
    return sf(`${BASE}/cms/contact-messages/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_read: true }),
    });
}

export async function markMessageAsUnread(id: number | string) {
    return sf(`${BASE}/cms/contact-messages/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_read: false }),
    });
}

export async function deleteContactMessage(id: number | string) {
    const r = await fetch(`${BASE}/cms/contact-messages/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── CONTACT INFO ──────────────────────────────────────────────────────────
export async function getContactInfos() {
    const data = await sf(`${BASE}/cms/contact-info/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getContactInfo(id: number | string) {
    return sf(`${BASE}/cms/contact-info/${id}/`, { headers: authHeaders() });
}

export async function createContactInfo(data: any) {
    return sf(`${BASE}/cms/contact-info/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateContactInfo(id: number | string, data: any) {
    return sf(`${BASE}/cms/contact-info/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteContactInfo(id: number | string) {
    const r = await fetch(`${BASE}/cms/contact-info/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── FACILITY ITEMS ────────────────────────────────────────────────────────
export async function getFacilityItems() {
    const data = await sf(`${BASE}/cms/facility-items/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getFacilityItem(id: number | string) {
    return sf(`${BASE}/cms/facility-items/${id}/`, { headers: authHeaders() });
}

export async function createFacilityItem(data: any) {
    return sf(`${BASE}/cms/facility-items/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateFacilityItem(id: number | string, data: any) {
    return sf(`${BASE}/cms/facility-items/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteFacilityItem(id: number | string) {
    const r = await fetch(`${BASE}/cms/facility-items/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── FAQS ──────────────────────────────────────────────────────────────────
export async function getFaqs() {
    const data = await sf(`${BASE}/cms/faqs/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getFaq(id: number | string) {
    return sf(`${BASE}/cms/faqs/${id}/`, { headers: authHeaders() });
}

export async function createFaq(data: any) {
    return sf(`${BASE}/cms/faqs/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateFaq(id: number | string, data: any) {
    return sf(`${BASE}/cms/faqs/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteFaq(id: number | string) {
    const r = await fetch(`${BASE}/cms/faqs/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── GALLERY ───────────────────────────────────────────────────────────────
export async function getGalleryItems() {
    const data = await sf(`${BASE}/cms/gallery/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getGalleryItem(id: number | string) {
    return sf(`${BASE}/cms/gallery/${id}/`, { headers: authHeaders() });
}

export async function createGalleryItem(data: any) {
    return sf(`${BASE}/cms/gallery/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateGalleryItem(id: number | string, data: any) {
    return sf(`${BASE}/cms/gallery/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteGalleryItem(id: number | string) {
    const r = await fetch(`${BASE}/cms/gallery/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── GROUP BENEFITS ────────────────────────────────────────────────────────
export async function getGroupBenefits() {
    const data = await sf(`${BASE}/cms/group-benefits/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getGroupBenefit(id: number | string) {
    return sf(`${BASE}/cms/group-benefits/${id}/`, { headers: authHeaders() });
}

export async function createGroupBenefit(data: any) {
    return sf(`${BASE}/cms/group-benefits/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateGroupBenefit(id: number | string, data: any) {
    return sf(`${BASE}/cms/group-benefits/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteGroupBenefit(id: number | string) {
    const r = await fetch(`${BASE}/cms/group-benefits/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── GROUP PACKAGES ────────────────────────────────────────────────────────
export async function getGroupPackages() {
    const data = await sf(`${BASE}/cms/group-packages/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getGroupPackage(id: number | string) {
    return sf(`${BASE}/cms/group-packages/${id}/`, { headers: authHeaders() });
}

export async function createGroupPackage(data: any) {
    return sf(`${BASE}/cms/group-packages/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateGroupPackage(id: number | string, data: any) {
    return sf(`${BASE}/cms/group-packages/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteGroupPackage(id: number | string) {
    const r = await fetch(`${BASE}/cms/group-packages/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── ACTIVITIES ────────────────────────────────────────────────────────────
export async function getActivities() {
    const data = await sf(`${BASE}/cms/activities/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getActivity(id: number | string) {
    return sf(`${BASE}/cms/activities/${id}/`, { headers: authHeaders() });
}

export async function createActivity(data: any) {
    return sf(`${BASE}/cms/activities/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateActivity(id: number | string, data: any) {
    return sf(`${BASE}/cms/activities/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteActivity(id: number | string) {
    const r = await fetch(`${BASE}/cms/activities/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── PAGE SECTIONS ─────────────────────────────────────────────────────────
export async function getPageSections(page?: string) {
    const url = page
        ? `${BASE}/cms/page-sections/?page=${page}`
        : `${BASE}/cms/page-sections/`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createPageSection(data: any) {
    return sf(`${BASE}/cms/page-sections/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updatePageSection(id: number | string, data: any) {
    return sf(`${BASE}/cms/page-sections/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deletePageSection(id: number | string) {
    const r = await fetch(`${BASE}/cms/page-sections/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── STAT CARDS ────────────────────────────────────────────────────────────
export async function getStatCards(page?: string) {
    const url = page
        ? `${BASE}/cms/stat-cards/?page=${page}`
        : `${BASE}/cms/stat-cards/`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createStatCard(data: any) {
    return sf(`${BASE}/cms/stat-cards/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateStatCard(id: number | string, data: any) {
    return sf(`${BASE}/cms/stat-cards/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteStatCard(id: number | string) {
    const r = await fetch(`${BASE}/cms/stat-cards/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── TIMELINE ITEMS ────────────────────────────────────────────────────────
export async function getTimelineItems() {
    const data = await sf(`${BASE}/cms/timeline-items/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createTimelineItem(data: any) {
    return sf(`${BASE}/cms/timeline-items/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateTimelineItem(id: number | string, data: any) {
    return sf(`${BASE}/cms/timeline-items/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteTimelineItem(id: number | string) {
    const r = await fetch(`${BASE}/cms/timeline-items/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── VALUE ITEMS ───────────────────────────────────────────────────────────
export async function getValueItems() {
    const data = await sf(`${BASE}/cms/value-items/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createValueItem(data: any) {
    return sf(`${BASE}/cms/value-items/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateValueItem(id: number | string, data: any) {
    return sf(`${BASE}/cms/value-items/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

// ── SETTINGS ──────────────────────────────────────────────────────────────
export async function getSettings() {
    const data = await sf(`${BASE}/core/settings/`, { headers: authHeaders() });
    if (!data) return null;
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.length > 0 ? list[0] : null;
}

export async function updateSettings(id: number | string, data: any) {
    return sf(`${BASE}/core/settings/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

// ── ATTRACTION VIDEO ──────────────────────────────────────────────────────
export async function getAttractionVideo(slug: string) {
    const data = await sf(`${BASE}/cms/attraction-videos/?slug=${slug}`, { headers: authHeaders() });
    if (!data) return null;
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.find((v: any) => v.slug === slug) || null;
}

export async function getAttractionVideos() {
    const data = await sf(`${BASE}/cms/attraction-videos/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

// ── loginAdmin alias ──────────────────────────────────────────────────────
export const loginAdmin = adminLogin;

// ── DELETE BOOKINGS ───────────────────────────────────────────────────────
export async function deleteBooking(id: number | string) {
    const r = await fetch(`${BASE}/bookings/bookings/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

export async function deletePartyBooking(id: number | string) {
    const r = await fetch(`${BASE}/bookings/party-bookings/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── UPDATE BOOKING DETAILS ────────────────────────────────────────────────
export async function updateBookingDetails(id: number | string, data: any) {
    return sf(`${BASE}/bookings/bookings/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

// ── CUSTOMERS ─────────────────────────────────────────────────────────────
export async function getCustomerById(id: number | string) {
    return sf(`${BASE}/bookings/customers/${id}/`, { headers: authHeaders() });
}

export async function getCustomerEmails(customerId: number | string) {
    const data = await sf(`${BASE}/bookings/customers/${customerId}/emails/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function updateCustomerDetails(id: number | string, data: any) {
    return sf(`${BASE}/bookings/customers/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

// ── WAIVERS ───────────────────────────────────────────────────────────────
export async function getWaivers(params?: { booking_id?: number | string; page?: number }) {
    let url = `${BASE}/bookings/waivers/`;
    const qs = new URLSearchParams();
    if (params?.booking_id) qs.set('booking_id', String(params.booking_id));
    if (params?.page) qs.set('page', String(params.page));
    const query = qs.toString();
    if (query) url += `?${query}`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return { results: [], count: 0 };
    return data;
}

export async function verifyWaiver(id: number | string) {
    return sf(`${BASE}/bookings/waivers/${id}/verify/`, {
        method: 'POST',
        headers: authHeaders(),
    });
}

export async function toggleWaiverVerification(id: number | string, verified: boolean) {
    return sf(`${BASE}/bookings/waivers/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ verified }),
    });
}

export async function updateWaiverMinors(id: number | string, minors: any[]) {
    return sf(`${BASE}/bookings/waivers/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ minors }),
    });
}

// ── PARTY BOOKING HISTORY/RESTORE ────────────────────────────────────────
export async function getPartyBookingHistory(id: number | string) {
    const data = await sf(`${BASE}/bookings/party-bookings/${id}/history/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function restorePartyBooking(id: number | string) {
    return sf(`${BASE}/bookings/party-bookings/${id}/restore/`, {
        method: 'POST',
        headers: authHeaders(),
    });
}

export async function reschedulePartyBooking(id: number | string, data: { date: string; time?: string }) {
    return sf(`${BASE}/bookings/party-bookings/${id}/reschedule/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function resendPartyBookingEmail(id: number | string) {
    return sf(`${BASE}/bookings/party-bookings/${id}/resend-email/`, {
        method: 'POST',
        headers: authHeaders(),
    });
}

// ── SESSION BOOKING HISTORY/RESTORE ──────────────────────────────────────
export async function getSessionBookingHistory(id: number | string) {
    const data = await sf(`${BASE}/bookings/bookings/${id}/history/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function restoreSessionBooking(id: number | string) {
    return sf(`${BASE}/bookings/bookings/${id}/restore/`, {
        method: 'POST',
        headers: authHeaders(),
    });
}

// ── SETTINGS/PASSWORD ─────────────────────────────────────────────────────
export async function updatePassword(data: { current_password: string; new_password: string }) {
    return sf(`${BASE}/core/users/change-password/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

// ── GUIDELINE CATEGORIES ──────────────────────────────────────────────────
export async function getGuidelineCategories() {
    const data = await sf(`${BASE}/cms/guideline-categories/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createGuidelineCategory(data: any) {
    return sf(`${BASE}/cms/guideline-categories/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateGuidelineCategory(id: number | string, data: any) {
    return sf(`${BASE}/cms/guideline-categories/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteGuidelineCategory(id: number | string) {
    const r = await fetch(`${BASE}/cms/guideline-categories/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── TIMING CARDS ──────────────────────────────────────────────────────────
export async function getTimingCards() {
    const data = await sf(`${BASE}/cms/timing-cards/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

// ── SOCIAL LINKS ──────────────────────────────────────────────────────────
export async function getSocialLinks() {
    const data = await sf(`${BASE}/cms/social-links/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createSocialLink(data: any) {
    return sf(`${BASE}/cms/social-links/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateSocialLink(id: number | string, data: any) {
    return sf(`${BASE}/cms/social-links/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteSocialLink(id: number | string) {
    const r = await fetch(`${BASE}/cms/social-links/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── MENU SECTIONS ─────────────────────────────────────────────────────────
export async function getMenuSections() {
    const data = await sf(`${BASE}/cms/menu-sections/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

// ── PARTY PACKAGES ────────────────────────────────────────────────────────
export async function getPartyPackages() {
    const data = await sf(`${BASE}/cms/party-packages/`, { headers: authHeaders() });
    if (!data) return [];
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.filter((p: any) => p.active !== false);
}

export async function deletePartyPackage(id: number | string) {
    const r = await fetch(`${BASE}/cms/party-packages/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

export async function createPartyPackage(data: any) {
    return sf(`${BASE}/cms/party-packages/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updatePartyPackage(id: number | string, data: any) {
    return sf(`${BASE}/cms/party-packages/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

// ── PRICING PLANS ─────────────────────────────────────────────────────────
export async function getPricingPlans() {
    const data = await sf(`${BASE}/cms/pricing-plans/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function createPricingPlan(data: any) {
    return sf(`${BASE}/cms/pricing-plans/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updatePricingPlan(id: number | string, data: any) {
    return sf(`${BASE}/cms/pricing-plans/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deletePricingPlan(id: number | string) {
    const r = await fetch(`${BASE}/cms/pricing-plans/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
        cache: 'no-store',
    });
    return r.ok;
}

// ── INSTAGRAM REELS ───────────────────────────────────────────────────────
export async function getInstagramReels() {
    const data = await sf(`${BASE}/cms/instagram-reels/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

// ── LEGAL DOCUMENTS ───────────────────────────────────────────────────────
export async function getLegalDocuments() {
    const data = await sf(`${BASE}/cms/legal-documents/`, { headers: authHeaders() });
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results || []);
}

export async function getLegalDocument(slug: string) {
    const data = await sf(`${BASE}/cms/legal-documents/?slug=${slug}`, { headers: authHeaders() });
    if (!data) return null;
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.find((d: any) => d.slug === slug) || null;
}

export async function updateLegalDocument(id: number | string, data: any) {
    return sf(`${BASE}/cms/legal-documents/${id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

// ── BOOKING INFORMATION ───────────────────────────────────────────────────
export async function getBookingInformation(type?: string) {
    const url = type
        ? `${BASE}/cms/booking-information/?booking_type=${type}`
        : `${BASE}/cms/booking-information/`;
    const data = await sf(url, { headers: authHeaders() });
    if (!data) return type ? null : [];
    if (type) {
        const list = Array.isArray(data) ? data : (data.results || []);
        return list.find((b: any) => b.booking_type === type) || null;
    }
    return Array.isArray(data) ? data : (data.results || []);
}

// ── TICKET ────────────────────────────────────────────────────────────────
export async function getTicket(id: string) {
    return sf(`${BASE}/bookings/bookings/${id}/ticket/`);
}
