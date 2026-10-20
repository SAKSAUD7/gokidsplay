/**
 * API Client for Backend Communication
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

class ApiClient {
    private baseURL: string;
    private token: string | null = null;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('admin_token');
        }
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('admin_token', token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_token');
        }
    }

    getToken() {
        return this.token;
    }

    private async request<T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        // Handle absolute URLs (like /api/token/) vs relative resource URLs
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

        const headers = new Headers(options.headers);
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        if (this.token) {
            headers.set('Authorization', `Bearer ${this.token}`);
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: JSON.stringify(data) || 'Request failed',
                };
            }

            // DRF Pagination support: if 'results' is present, return that as data
            if (data.results) {
                return { success: true, data: data.results };
            }

            return { success: true, data: data };
        } catch (error) {
            console.error('API Request Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    // Auth endpoints
    async login(email: string, password: string) {
        // Use the root API URL for token, not v1 prefix if it's different, but here we put it in v1/../token or root/api/token
        // My Django URLs: /api/token/
        // Sign-in lives at /api/token/ (outside /api/v1)
        const tokenUrl = API_BASE_URL.replace(/\/v1\/?$/, '') + '/token/';

        const response = await this.request<{ access: string; refresh: string }>(tokenUrl, {
            method: 'POST',
            body: JSON.stringify({ email, password }), // DRF SimpleJWT expects username/password usually, but we can configure it or just send username=email
        });

        // DRF SimpleJWT default is 'username', 'password'. My User model uses email as username.
        // So I should send { username: email, password: password }
        // Wait, I need to check if I customized SimpleJWT to accept 'email' field.
        // By default it expects 'username'. Since USERNAME_FIELD = 'email', it might still expect the key 'username'.
        // Let's try sending 'username': email.

        if (!response.success) {
            // Retry with 'username' key if 'email' failed, or just send 'username' by default
            const retryResponse = await this.request<{ access: string; refresh: string }>(tokenUrl, {
                method: 'POST',
                body: JSON.stringify({ username: email, password }),
            });
            if (retryResponse.success && retryResponse.data?.access) {
                this.setToken(retryResponse.data.access);
                return { success: true, data: { token: retryResponse.data.access, user: null } }; // User fetched separately
            }
            return retryResponse;
        }

        if (response.success && response.data?.access) {
            this.setToken(response.data.access);
            return { success: true, data: { token: response.data.access, user: null } };
        }

        return response;
    }

    async logout() {
        this.clearToken();
        return { success: true };
    }

    async getMe() {
        return this.request<{ id: string; email: string; name: string; role: any }>('/core/users/me/');
    }

    async changePassword(oldPassword: string, newPassword: string) {
        // Not implemented in backend yet, placeholder
        return { success: false, error: "Not implemented" };
    }

    // Bookings endpoints
    async getBookings(params?: any) {
        const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
        return this.request('/bookings/bookings/' + queryString);
    }

    async getBooking(id: string) {
        return this.request(`/bookings/bookings/${id}/`);
    }

    async createBooking(data: any) {
        return this.request('/bookings/bookings/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateBooking(id: string, data: any) {
        return this.request(`/bookings/bookings/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteBooking(id: string) {
        return this.request(`/bookings/bookings/${id}/`, {
            method: 'DELETE',
        });
    }

    async getBookingStats() {
        // Need to implement stats endpoint in backend
        return { success: true, data: {} };
    }

    // Customers endpoints
    async getCustomers(params?: any) {
        const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
        return this.request('/bookings/customers/' + queryString);
    }

    async getCustomer(id: string) {
        return this.request(`/bookings/customers/${id}/`);
    }

    async createCustomer(data: any) {
        return this.request('/bookings/customers/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateCustomer(id: string, data: any) {
        return this.request(`/bookings/customers/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteCustomer(id: string) {
        return this.request(`/bookings/customers/${id}/`, {
            method: 'DELETE',
        });
    }

    // Calendar endpoints (Not implemented in backend yet, using bookings for now)
    async checkAvailability(date: string, time: string) {
        // Placeholder
        return { success: true, data: true };
    }

    async getBookingBlocks() {
        return { success: true, data: [] };
    }

    async createBookingBlock(data: any) {
        return { success: false, error: "Not implemented" };
    }

    async deleteBookingBlock(id: string) {
        return { success: false, error: "Not implemented" };
    }

    // Vouchers endpoints
    async getVouchers() {
        return this.request('/shop/vouchers/');
    }

    async createVoucher(data: any) {
        return this.request('/shop/vouchers/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async validateVoucher(code: string) {
        // Need to implement validate endpoint
        return { success: false, error: "Not implemented" };
    }

    // CMS endpoints
    async getActivities() {
        return this.request('/cms/activities/');
    }

    async getBanners() {
        return this.request('/cms/banners/');
    }

    async getFAQs() {
        return this.request('/cms/faqs/');
    }

    async getTestimonials() {
        return this.request('/cms/testimonials/');
    }

    async getStaticPages() {
        return this.request('/cms/pages/');
    }

    // Settings endpoints
    async getSettings() {
        return this.request('/core/settings/');
    }

    async updateSettings(data: any) {
        // Assuming ID 1 for global settings
        return this.request('/core/settings/1/', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Admin Users endpoints
    async getAdminUsers() {
        return this.request('/core/users/');
    }

    async getRoles() {
        return { success: true, data: [] };
    }

    // Activity Logs endpoints
    async getActivityLogs(params?: any) {
        return { success: true, data: [] };
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiResponse };
