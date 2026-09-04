/**
 * ============================================================
 *  Go Kids Play — Centralized API Endpoints
 * ============================================================
 *
 * HOW THIS WORKS
 * ──────────────
 * There are TWO API layers in this project:
 *
 *   1. BACKEND_ENDPOINTS — Direct calls to the Django REST API.
 *      Used in: Next.js API proxy routes (app/api/.../route.ts)
 *      and server-side actions (app/actions/.../server).
 *      Base URL is controlled by NEXT_PUBLIC_API_URL.
 *
 *   2. PROXY_ENDPOINTS — Calls to the Next.js internal proxy routes
 *      (app/api/**). Used in: client components (useEffect, fetch).
 *      These always start with /api/* and never expose the backend URL.
 *
 * TO SWITCH FROM LOCAL → PRODUCTION
 * ──────────────────────────────────
 * Only ONE thing needs to change in your .env:
 *   NEXT_PUBLIC_API_URL=https://your-azure-app.azurewebsites.net/api/v1
 *
 * Everything else updates automatically.
 * ============================================================
 */

// ─── Base URLs ────────────────────────────────────────────────────────────────

/** Django backend base URL — change this env var to switch environments */
const BACKEND_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1";

/** Next.js internal proxy base — always relative, never changes */
const PROXY_BASE = "/api";

// ─── Backend Endpoints (used in server-side code & proxy routes) ──────────────

export const BACKEND = {
    // ── Auth (JWT) ────────────────────────────────────────────────────────────
    AUTH: {
        LOGIN:          `${BACKEND_BASE.replace('/api/v1', '')}/api/token/`,
        REFRESH:        `${BACKEND_BASE.replace('/api/v1', '')}/api/token/refresh/`,
    },

    // ── Bookings ──────────────────────────────────────────────────────────────
    BOOKINGS: {
        LIST:           `${BACKEND_BASE}/bookings/bookings/`,
        DETAIL:         (id: number | string) => `${BACKEND_BASE}/bookings/bookings/${id}/`,
        CREATE:         `${BACKEND_BASE}/bookings/bookings/`,
        TICKET:         (uuid: string) => `${BACKEND_BASE}/bookings/bookings/ticket/${uuid}/`,
        CHECK_DUPLICATE:`${BACKEND_BASE}/bookings/bookings/check_duplicate/`,
        SLOT_AVAILABILITY:`${BACKEND_BASE}/bookings/bookings/slot_availability/`,
        MARK_ARRIVED:   (id: number) => `${BACKEND_BASE}/bookings/bookings/${id}/mark_arrived/`,
        MARK_NOT_ARRIVED:(id: number) => `${BACKEND_BASE}/bookings/bookings/${id}/mark_not_arrived/`,
        BOOKING_BLOCKS: `${BACKEND_BASE}/bookings/booking-blocks/`,
    },

    // ── Party Bookings ────────────────────────────────────────────────────────
    PARTY_BOOKINGS: {
        LIST:           `${BACKEND_BASE}/bookings/party-bookings/`,
        DETAIL:         (id: number | string) => `${BACKEND_BASE}/bookings/party-bookings/${id}/`,
        CREATE:         `${BACKEND_BASE}/bookings/party-bookings/`,
        TICKET:         (uuid: string) => `${BACKEND_BASE}/bookings/party-bookings/ticket/${uuid}/`,
        MARK_ARRIVED:   (id: number) => `${BACKEND_BASE}/bookings/party-bookings/${id}/mark_arrived/`,
        MARK_NOT_ARRIVED:(id: number) => `${BACKEND_BASE}/bookings/party-bookings/${id}/mark_not_arrived/`,
        ADD_PARTICIPANTS:(uuid: string) => `${BACKEND_BASE}/bookings/party-bookings/${uuid}/add_participants/`,
    },

    // ── Customers ─────────────────────────────────────────────────────────────
    CUSTOMERS: {
        LIST:           `${BACKEND_BASE}/bookings/customers/`,
        DETAIL:         (id: number) => `${BACKEND_BASE}/bookings/customers/${id}/`,
    },

    // ── Customer Auth (portal login) ──────────────────────────────────────────
    CUSTOMER_AUTH: {
        REGISTER:       `${BACKEND_BASE}/bookings/customer-auth/register/`,
        LOGIN:          `${BACKEND_BASE}/bookings/customer-auth/login/`,
        LOGOUT:         `${BACKEND_BASE}/bookings/customer-auth/logout/`,
        ME:             `${BACKEND_BASE}/bookings/customer-auth/me/`,
        UPDATE_PROFILE: `${BACKEND_BASE}/bookings/customer-auth/profile/`,
        CHANGE_PASSWORD:`${BACKEND_BASE}/bookings/customer-auth/change-password/`,
        MY_BOOKINGS:    `${BACKEND_BASE}/bookings/customer-auth/my-bookings/`,
        // Admin management of customer accounts
        ADMIN_ACCOUNT:  (id: number) => `${BACKEND_BASE}/bookings/customer-auth/admin/account/${id}/`,
        ADMIN_RESET_PW: (id: number) => `${BACKEND_BASE}/bookings/customer-auth/admin/reset-password/${id}/`,
        ADMIN_REVOKE:   (id: number) => `${BACKEND_BASE}/bookings/customer-auth/admin/revoke-token/${id}/`,
    },

    // ── Waivers ───────────────────────────────────────────────────────────────
    WAIVERS: {
        LIST:           `${BACKEND_BASE}/bookings/waivers/`,
        DETAIL:         (id: number) => `${BACKEND_BASE}/bookings/waivers/${id}/`,
        EXPORT_CSV:     `${BACKEND_BASE}/bookings/waivers/export/`,
        PDF:            (id: number) => `${BACKEND_BASE}/bookings/waivers/${id}/pdf/`,
    },

    // ── Transactions ──────────────────────────────────────────────────────────
    TRANSACTIONS: {
        LIST:           `${BACKEND_BASE}/bookings/transactions/`,
        DETAIL:         (id: number) => `${BACKEND_BASE}/bookings/transactions/${id}/`,
    },

    // ── Calendar ──────────────────────────────────────────────────────────────
    CALENDAR: {
        BOOKINGS:       `${BACKEND_BASE}/bookings/calendar/`,
    },

    // ── Payments (SumUp) ──────────────────────────────────────────────────────
    PAYMENTS: {
        CHECKOUT:       `${BACKEND_BASE}/payments/sumup/checkout/`,
        VERIFY:         `${BACKEND_BASE}/payments/sumup/verify/`,
        STATUS:         (id: string) => `${BACKEND_BASE}/payments/sumup/status/${id}/`,
    },

    // ── CMS ───────────────────────────────────────────────────────────────────
    CMS: {
        SESSION_CONFIG: `${BACKEND_BASE}/cms/session-booking-config/1/`,
        PARTY_CONFIG:   `${BACKEND_BASE}/cms/party-booking-config/1/`,
        ACTIVITIES:     `${BACKEND_BASE}/cms/activities/`,
        LOGOS:          `${BACKEND_BASE}/cms/logos/`,
        GALLERY:        `${BACKEND_BASE}/cms/gallery/`,
        REVIEWS:        `${BACKEND_BASE}/cms/reviews/`,
        STATS:          `${BACKEND_BASE}/cms/stats/`,
        HERO:           `${BACKEND_BASE}/cms/hero/`,
        TIMING_CARDS:   `${BACKEND_BASE}/cms/timing-cards/`,
        VALUE_ITEMS:    `${BACKEND_BASE}/cms/value-items/`,
        STATIC_PAGES:   `${BACKEND_BASE}/cms/static-pages/`,
        SOCIAL_MEDIA:   `${BACKEND_BASE}/cms/social-media/`,
        FREE_ENTRIES:   `${BACKEND_BASE}/cms/free-entries/`,
        PRODUCTS:       `${BACKEND_BASE}/cms/products/`,
        VIDEO_UPLOAD:   `${BACKEND_BASE}/cms/video-upload/`,
        UPLOAD:         `${BACKEND_BASE}/cms/upload/`,
        NOTIFICATIONS:  `${BACKEND_BASE}/cms/notifications/`,
    },

    // ── Marketing ─────────────────────────────────────────────────────────────
    MARKETING: {
        CONTACT:        `${BACKEND_BASE}/marketing/contact/`,
        NEWSLETTER:     `${BACKEND_BASE}/marketing/newsletter/`,
    },

    // ── Invitations ───────────────────────────────────────────────────────────
    INVITATIONS: {
        LIST:           `${BACKEND_BASE}/invitations/`,
        DETAIL:         (id: number) => `${BACKEND_BASE}/invitations/${id}/`,
    },

    // ── Admin Users / Roles ───────────────────────────────────────────────────
    USERS: {
        LIST:           `${BACKEND_BASE}/core/users/`,
        DETAIL:         (id: number) => `${BACKEND_BASE}/core/users/${id}/`,
        ROLES:          `${BACKEND_BASE}/core/roles/`,
        SEED_ROLES:     `${BACKEND_BASE}/core/seed-roles/`,
    },

    // ── Documentation (Swagger) ───────────────────────────────────────────────
    DOCS: {
        SWAGGER:        `${BACKEND_BASE.replace('/api/v1', '')}/api/docs/`,
        REDOC:          `${BACKEND_BASE.replace('/api/v1', '')}/api/redoc/`,
        SCHEMA:         `${BACKEND_BASE.replace('/api/v1', '')}/api/schema/`,
    },
} as const;

// ─── Proxy Endpoints (used in client components) ──────────────────────────────
// These are the Next.js /app/api/** internal proxy routes.
// They never change — they always proxy to the BACKEND_* URLs above.

export const PROXY = {
    // ── Auth ──────────────────────────────────────────────────────────────────
    SESSION:                `${PROXY_BASE}/admin/session`,

    // ── Bookings ──────────────────────────────────────────────────────────────
    BOOKINGS: {
        LIST:               `${PROXY_BASE}/bookings`,
        DETAIL:             (id: number | string) => `${PROXY_BASE}/bookings/${id}`,
        SLOT_AVAILABILITY:  `${PROXY_BASE}/bookings/slot-availability`,
    },

    // ── Party Bookings ────────────────────────────────────────────────────────
    PARTY_BOOKINGS: {
        LIST:               `${PROXY_BASE}/party-bookings`,
        PARTICIPANTS:       (id: number | string) => `${PROXY_BASE}/party-bookings/${id}/participants`,
    },

    // ── Waivers ───────────────────────────────────────────────────────────────
    WAIVERS: {
        LIST:               `${PROXY_BASE}/waivers`,
        PDF:                (id: number | string) => `${PROXY_BASE}/waivers/${id}/pdf`,
        EXPORT:             `${PROXY_BASE}/waivers/export`,
    },

    // ── Calendar ──────────────────────────────────────────────────────────────
    CALENDAR:               `${PROXY_BASE}/calendar`,

    // ── CMS ───────────────────────────────────────────────────────────────────
    CMS: {
        BASE:               `${PROXY_BASE}/cms`,
        UPLOAD:             `${PROXY_BASE}/cms/upload`,
        VIDEO_UPLOAD:       `${PROXY_BASE}/cms/video-upload`,
    },

    // ── Notifications ─────────────────────────────────────────────────────────
    NOTIFICATIONS:          `${PROXY_BASE}/notifications`,

    // ── Party Config ──────────────────────────────────────────────────────────
    PARTY_CONFIG:           `${PROXY_BASE}/party-config`,

    // ── Customer Account (admin management) ───────────────────────────────────
    CUSTOMER_ACCOUNT: {
        DETAIL:             (id: number | string) => `${PROXY_BASE}/admin/customer-account/${id}`,
        RESET_PASSWORD:     (id: number | string) => `${PROXY_BASE}/admin/customer-account/${id}/reset-password`,
        REVOKE_TOKEN:       (id: number | string) => `${PROXY_BASE}/admin/customer-account/${id}/revoke-token`,
    },

    // ── Admin Utilities ───────────────────────────────────────────────────────
    SEED_ROLES:             `${PROXY_BASE}/seed-roles`,
} as const;

// ─── Environment helpers ───────────────────────────────────────────────────────

/** True when running locally (development mode) */
export const IS_DEV = process.env.NODE_ENV === "development";

/** Current backend base URL (useful for logging/debugging) */
export const BACKEND_URL = BACKEND_BASE;
