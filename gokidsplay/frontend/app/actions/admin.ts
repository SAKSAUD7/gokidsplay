"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchAPI } from "../lib/server-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:9000/api/v1';

export async function updateBooking(id: string | number, data: any) {
    try {
        const res = await fetchAPI(`/bookings/bookings/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });

        if (!res || !res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.detail || "Failed to update booking",
            };
        }

        revalidatePath("/admin/bookings");
        revalidatePath(`/admin/bookings/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Update booking error:", error);
        return { success: false, error: "Failed to connect to server" };
    }
}

// --- Helper Functions ---

// Transform Django snake_case to camelCase for Booking
function transformBooking(b: any) {
    if (!b) return null;
    const customer = b.customer_details ? transformCustomer(b.customer_details) : null;
    return {
        ...b,
        bookingStatus: b.booking_status || b.status,
        waiverStatus: b.waiver_status,
        paymentStatus: b.payment_status,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
        voucherCode: b.voucher_code,
        discountAmount: b.discount_amount,
        // Party booking specific fields
        packageName: b.package_name,
        birthdayChildName: b.birthday_child_name,
        birthdayChildAge: b.birthday_child_age,
        waiverSigned: b.waiver_signed,
        waiverSignedAt: b.waiver_signed_at,
        waiverIpAddress: b.waiver_ip_address,
        // Add flat customer properties for easy access
        customerName: b.name || customer?.name || null,
        customerEmail: customer?.email || b.email || null,
        customerPhone: customer?.phone || b.phone || null,
        customer: customer,
        waivers: b.waivers?.map(transformWaiver) || [],
        transactions: b.transactions || [],
        // Default values for missing fields
        duration: b.duration || 120, // Default 2 hours for party bookings
        spectators: b.spectators || 0,
    };
}

function transformCustomer(c: any) {
    if (!c) return null;
    return {
        ...c,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        _count: c._count || { bookings: 0 }
    };
}

function transformWaiver(w: any) {
    if (!w) return null;
    return {
        ...w,
        signedAt: w.signed_at,
        fileUrl: w.file_url,
        emergencyContact: w.emergency_contact,
        minors: w.minors || [],  // Preserve minors field
        adults: w.adults || [],  // Preserve adults field
        isPrimarySigner: w.is_primary_signer,
        participantType: w.participant_type,
        isVerified: w.is_verified,
        // If details object exists, use it; otherwise fallback to the ID (or null)
        booking: w.booking_details ? transformBooking(w.booking_details) : (w.booking || null),
        partyBooking: w.party_booking_details ? transformBooking(w.party_booking_details) : (w.party_booking || null)
    };
}

// ... (other functions)

function transformBookingBlock(b: any) {
    if (!b) return null;
    return {
        ...b,
        startDate: b.start_date,
        endDate: b.end_date,
        createdAt: b.created_at,
        updatedAt: b.updated_at
    };
}

// --- Auth Actions ---

export async function loginAdmin(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    // Use the API_URL environment variable for production
    // Token endpoint is at /api/token/, not /api/v1/token/
    const baseUrl = API_URL.replace('/api/v1', '');
    const targetUrl = `${baseUrl}/api/token/`;
    console.log('[Login Debug] Target URL:', targetUrl);

    try {
        const res = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Send both email and username (mapped to email) to cover all backend config bases
            body: JSON.stringify({ email, username: email, password }),
            cache: 'no-store', // Disable caching
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[Login Debug] Failed response:', res.status, errorText);
            return { error: `Login failed: ${res.status} ${res.statusText}` };
        }

        const data = await res.json();
        const token = data.access;
        const refreshToken = data.refresh;

        // Get the cookies instance
        const cookieStore = cookies();

        // Set the access token cookie (used for all API requests)
        cookieStore.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 8, // 8 hours (matches new JWT lifetime)
            path: "/",
            sameSite: "lax"
        });

        // Set the refresh token cookie (used to silently renew the access token)
        if (refreshToken) {
            cookieStore.set("admin_refresh_token", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: "/",
                sameSite: "lax"
            });
        }

        console.log('[Login Debug] Cookie set successfully, redirecting to /admin');

    } catch (error: any) {
        console.error("Login error:", error);
        return { error: `Connection error: ${error.message}` };
    }

    // Redirect AFTER cookie is set
    redirect("/admin");
}

export async function logoutAdmin() {
    cookies().delete("admin_token");
    cookies().delete("admin_refresh_token");
    redirect("/admin/login");
}

// --- Dashboard Actions ---

export async function getDashboardStats() {
    try {
        const res = await fetchAPI("/core/dashboard/stats/");
        if (!res || !res.ok) {
            console.error("[getDashboardStats] Failed to fetch stats, returning defaults");
            return getDefaultDashboardStats();
        }
        return await res.json();
    } catch (error) {
        console.error("[getDashboardStats] Error:", error);
        return getDefaultDashboardStats();
    }
}

function getDefaultDashboardStats() {
    return {
        totalBookings: 0,
        avgBookingValue: 0,
        unreadMessages: 0,
        latestMessagePreview: "",
        waiverCompletionRate: 0,
        pendingWaivers: 0,
        todayBookings: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        totalRevenue: 0,
        recentBookings: [],
        monthlyRevenue: [],
        bookingsByStatus: {},
        topActivities: [],
    };
}

export async function getAllBookings(filter?: { type?: string; status?: string; search?: string }): Promise<any[]> {
    try {
        // Fetch both session and party bookings in parallel
        const [sessionBookings, partyBookings] = await Promise.all([
            getBookings(filter),
            getPartyBookings(filter)
        ]);

        // Combine and sort by created_at
        const allBookings = [...sessionBookings, ...partyBookings].sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
            const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
            return dateB - dateA;
        });

        console.log('[getAllBookings] Session:', sessionBookings.length, 'Party:', partyBookings.length, 'Total:', allBookings.length);
        return allBookings;
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        return [];
    }
}

// --- Booking Actions ---

export async function getBookings(filter?: { status?: string; date?: string; search?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append("ordering", "-created_at");
    if (filter?.status) params.append("booking_status", filter.status);
    if (filter?.date) params.append("date", filter.date);
    if (filter?.search) params.append("search", filter.search);

    const res = await fetchAPI(`/bookings/bookings/?${params.toString()}`);
    if (!res || !res.ok) return [];

    const data = await res.json();
    return data.map(transformBooking);
}

export async function getPartyBookings(filter?: { status?: string; date?: string; search?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append("ordering", "-created_at");
    if (filter?.status) params.append("status", filter.status);
    if (filter?.date) params.append("date", filter.date);
    if (filter?.search) params.append("search", filter.search);

    const res = await fetchAPI(`/bookings/party-bookings/?${params.toString()}`);
    if (!res || !res.ok) return [];

    const data = await res.json();
    return data.map(transformBooking);
}

export async function getPartyBookingById(id: string) {
    const res = await fetchAPI(`/bookings/party-bookings/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformBooking(data);
}

export async function updatePartyBookingStatus(id: string, status: string) {
    const res = await fetchAPI(`/bookings/party-bookings/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ booking_status: status })
    });

    if (res && res.ok) {
        revalidatePath("/admin/party-bookings");
        revalidatePath(`/admin/party-bookings/${id}`);
    }
}

export async function reschedulePartyBooking(id: string, newDate: string, newTime: string) {
    const res = await fetchAPI(`/bookings/party-bookings/${id}/reschedule/`, {
        method: "POST",
        body: JSON.stringify({ new_date: newDate, new_time: newTime })
    });

    if (res && res.ok) {
        revalidatePath("/admin/party-bookings");
        revalidatePath(`/admin/party-bookings/${id}`);
        const data = await res.json();
        return { success: true, message: data.message, admin_fee_charged: data.admin_fee_charged };
    }

    const errorData = await res?.json().catch(() => ({}));
    return { success: false, error: errorData?.error || errorData?.detail || "Failed to reschedule booking" };
}

export async function deletePartyBooking(id: string) {
    const res = await fetchAPI(`/bookings/party-bookings/${id}/`, {
        method: "DELETE"
    });

    if (res && res.ok) {
        revalidatePath("/admin/party-bookings");
    }

    return res?.ok;
}

export async function resendPartyBookingEmail(id: string) {
    const res = await fetchAPI(`/bookings/party-bookings/${id}/resend_confirmation_email/`, {
        method: "POST"
    });

    if (res && res.ok) {
        const data = await res.json();
        return { success: true, message: data.message };
    }

    return { success: false, message: "Failed to send email" };
}

export async function updatePartyBooking(id: string, data: any) {
    const res = await fetchAPI(`/bookings/party-bookings/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

    if (res && res.ok) {
        revalidatePath("/admin/party-bookings");
        revalidatePath(`/admin/party-bookings/${id}`);
        return { success: true };
    }

    // Try to get error message if available
    const errorData = await res?.json().catch(() => ({}));
    return { success: false, error: errorData.detail || "Failed to update booking" };
}

export async function getSessionBookings(filter?: { status?: string; date?: string; search?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append("type", "SESSION");
    params.append("ordering", "-created_at"); // Ensure latest first
    if (filter?.status) params.append("status", filter.status);
    if (filter?.date) params.append("date", filter.date);
    if (filter?.search) params.append("search", filter.search);

    console.log('[DEBUG] getSessionBookings - Request URL:', `/bookings/bookings/?${params.toString()}`);

    const res = await fetchAPI(`/bookings/bookings/?${params.toString()}`);

    console.log('[DEBUG] getSessionBookings - Response status:', res?.status);
    console.log('[DEBUG] getSessionBookings - Response ok:', res?.ok);

    if (!res || !res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error('[DEBUG] getSessionBookings - Error:', errorText);
        throw new Error(`API returned ${res?.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log('[DEBUG] getSessionBookings - Response data:', data);
    console.log('[DEBUG] getSessionBookings - Data length:', data?.length);

    return data.map(transformBooking);
}

export async function updateBookingStatus(id: string, status: string) {
    const res = await fetchAPI(`/bookings/bookings/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ booking_status: status })
    });

    if (res && res.ok) {
        revalidatePath("/admin/bookings");
        revalidatePath(`/admin/bookings/${id}`);
    }
}

export async function deleteBooking(id: string) {
    const res = await fetchAPI(`/bookings/bookings/${id}/`, {
        method: "DELETE"
    });

    if (res && res.ok) {
        revalidatePath("/admin/bookings");
    }

    return res?.ok;
}

export async function updateBookingDetails(id: string, data: { date?: string; time?: string; guests?: number; amount?: number }) {
    const res = await fetchAPI(`/bookings/bookings/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

    if (res && res.ok) {
        revalidatePath("/admin/bookings");
        revalidatePath(`/admin/bookings/${id}`);
    }
}

export async function getBookingById(id: string) {
    const res = await fetchAPI(`/bookings/bookings/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformBooking(data);
}

// --- Waiver Actions ---

export async function verifyWaiver(id: string) {
    const res = await fetchAPI(`/bookings/waivers/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_verified: true })
    });

    if (res && res.ok) {
        revalidatePath("/admin/waivers");
        return { success: true };
    }
    return { success: false };
}

export async function toggleWaiverVerification(id: string, isVerified: boolean) {
    const res = await fetchAPI(`/bookings/waivers/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_verified: isVerified })
    });

    if (res && res.ok) {
        revalidatePath("/admin/waivers");
        return { success: true };
    }

    // Log error details
    let errorMessage = "Failed to update status";
    if (res) {
        const errorText = await res.text();
        console.error(`toggleWaiverVerification failed: ${res.status} ${res.statusText}`, errorText);
        errorMessage = `Error: ${res.status} ${res.statusText}`;
    } else {
        console.error("toggleWaiverVerification failed: No response");
    }

    return { success: false, error: errorMessage };
}

export async function updateWaiverMinors(id: string, minors: any[]) {
    const payload = { minors };
    console.log('updateWaiverMinors - Sending payload:', JSON.stringify(payload, null, 2));
    console.log('updateWaiverMinors - Endpoint:', `/bookings/waivers/${id}/`);

    const res = await fetchAPI(`/bookings/waivers/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });

    console.log('updateWaiverMinors - Response status:', res?.status);
    console.log('updateWaiverMinors - Response ok:', res?.ok);

    if (res && res.ok) {
        revalidatePath("/admin/waivers");
        revalidatePath(`/admin/waivers/${id}`);
        return { success: true };
    }

    // Log error details and get the actual error message
    let errorMessage = "Failed to update minors";
    if (res) {
        try {
            const errorData = await res.json();
            console.error(`updateWaiverMinors failed: ${res.status} ${res.statusText}`, errorData);
            errorMessage = errorData.minors ? errorData.minors[0] : (errorData.detail || `Error: ${res.status} ${res.statusText}`);
        } catch (e) {
            const errorText = await res.text();
            console.error(`updateWaiverMinors failed: ${res.status} ${res.statusText}`, errorText);
            errorMessage = `Error: ${res.status} ${res.statusText}`;
        }
    }

    return { success: false, error: errorMessage };
}

export async function getWaivers(search?: string, bookingId?: string, partyBookingId?: string, isVerified?: boolean): Promise<any[]> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (bookingId) params.append("booking_id", bookingId);
    if (partyBookingId) params.append("party_booking_id", partyBookingId);
    if (isVerified !== undefined) params.append("is_verified", isVerified.toString());

    const res = await fetchAPI(`/bookings/waivers/?${params.toString()}`);
    if (!res || !res.ok) return [];

    const data = await res.json();
    
    // Handle paginated response ({count, results}) or legacy flat array
    const results = Array.isArray(data) ? data : (data.results ?? []);
    
    return results.map(transformWaiver);
}

// --- Customer Actions ---

export async function updateCustomerDetails(id: string, data: { name?: string; email?: string; phone?: string }) {
    const res = await fetchAPI(`/bookings/customers/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

    if (res && res.ok) {
        revalidatePath("/admin/customers");
    }
}

export async function getCustomers(search?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);

    const res = await fetchAPI(`/bookings/customers/?${params.toString()}`);
    if (!res || !res.ok) return [];

    const data = await res.json();
    return data.map(transformCustomer);
}

export async function getCustomerById(id: string) {
    const res = await fetchAPI(`/bookings/customers/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformCustomer(data);
}

export async function getCustomerEmails(id: string) {
    const res = await fetchAPI(`/bookings/customers/${id}/emails/`);
    if (!res || !res.ok) return [];
    return await res.json();
}

export async function getWaiverById(id: string) {
    const res = await fetchAPI(`/bookings/waivers/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformWaiver(data);
}

// --- Booking Block Actions ---

export async function getBookingBlocks(): Promise<any[]> {
    const res = await fetchAPI("/bookings/booking-blocks/");
    if (!res || !res.ok) return [];

    const data = await res.json();
    return data.map(transformBookingBlock);
}

export async function createBookingBlock(data: { startDate: Date; endDate: Date; reason: string; type: string; recurring: boolean }) {
    const payload = {
        start_date: data.startDate,
        end_date: data.endDate,
        reason: data.reason,
        type: data.type,
        recurring: data.recurring
    };

    const res = await fetchAPI("/bookings/booking-blocks/", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (res && res.ok) {
        revalidatePath("/admin/booking-blocks");
        return { success: true };
    }

    if (!res || !res.ok) {
        let errorMessage;
        const contentType = res?.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            try {
                const error = await res.json();
                errorMessage = error.detail || "Failed to create booking block";
            } catch (e) {
                errorMessage = "Failed to parse error response";
            }
        } else {
            const text = await res?.text();
            errorMessage = `Request failed (${res?.status}): ${text ? text.slice(0, 200) : 'Unknown error'}...`;
            console.error('[createBookingBlock] Non-JSON error:', text);
        }
        throw new Error(errorMessage);
    }
}

export async function updateBookingBlock(id: string, data: { startDate: Date; endDate: Date; reason: string; type: string; recurring: boolean }) {
    const payload = {
        start_date: data.startDate,
        end_date: data.endDate,
        reason: data.reason,
        type: data.type,
        recurring: data.recurring
    };

    const res = await fetchAPI(`/bookings/booking-blocks/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });

    if (res && res.ok) {
        revalidatePath("/admin/booking-blocks");
        return { success: true };
    }

    if (!res || !res.ok) {
        let errorMessage;
        const contentType = res?.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            try {
                const error = await res.json();
                errorMessage = error.detail || "Failed to update booking block";
            } catch (e) {
                errorMessage = "Failed to parse error response";
            }
        } else {
            const text = await res?.text();
            errorMessage = `Request failed (${res?.status}): ${text ? text.slice(0, 200) : 'Unknown error'}...`;
            console.error('[updateBookingBlock] Non-JSON error:', text);
        }
        throw new Error(errorMessage);
    }
}

export async function deleteBookingBlock(id: string) {
    const res = await fetchAPI(`/bookings/booking-blocks/${id}/`, {
        method: "DELETE"
    });

    if (res && res.ok) {
        revalidatePath("/admin/booking-blocks");
    }
}

// --- Arrival Status Actions ---

export async function toggleBookingArrival(
    bookingId: string | number,
    type: 'session' | 'party',
    setArrived: boolean
) {
    const endpoint = type === 'session'
        ? `/bookings/bookings/${bookingId}/${setArrived ? 'mark_arrived' : 'mark_not_arrived'}/`
        : `/bookings/party-bookings/${bookingId}/${setArrived ? 'mark_arrived' : 'mark_not_arrived'}/`;

    try {
        const res = await fetchAPI(endpoint, { method: "POST" });

        if (res && res.ok) {
            // Revalidate relevant pages
            revalidatePath("/admin/bookings");
            revalidatePath("/admin/party-bookings");
            revalidatePath(`/admin/${type}-bookings/${bookingId}`); // View page
            return { success: true };
        }

        return { success: false, error: "API request failed" };
    } catch (error) {
        console.error("Error toggling arrival:", error);
        return { success: false, error: String(error) };
    }
}

// --- Booking History Actions ---

export async function getSessionBookingHistory(): Promise<any[]> {
    const res = await fetchAPI("/bookings/session-booking-history/");
    if (!res || !res.ok) return [];

    const data = await res.json();
    // Transform snake_case to camelCase
    return data.map((h: any) => ({
        ...h,
        canRestore: h.can_restore,
        restoredAt: h.restored_at,
        restoredBy: h.restored_by,
        restoredByName: h.restored_by_name,
        restoredBookingId: h.restored_booking_id,
        originalBookingId: h.original_booking_id,
        paymentTransactionId: h.payment_transaction_id,
        paymentAmount: h.payment_amount,
        failureReason: h.failure_reason,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
        voucherCode: h.voucher_code,
        discountAmount: h.discount_amount,
    }));
}

export async function getPartyBookingHistory(): Promise<any[]> {
    const res = await fetchAPI("/bookings/party-booking-history/");
    if (!res || !res.ok) return [];

    const data = await res.json();
    // Transform snake_case to camelCase
    return data.map((h: any) => ({
        ...h,
        canRestore: h.can_restore,
        restoredAt: h.restored_at,
        restoredBy: h.restored_by,
        restoredByName: h.restored_by_name,
        restoredBookingId: h.restored_booking_id,
        originalBookingId: h.original_booking_id,
        paymentTransactionId: h.payment_transaction_id,
        paymentAmount: h.payment_amount,
        failureReason: h.failure_reason,
        packageName: h.package_name,
        birthdayChildName: h.birthday_child_name,
        birthdayChildAge: h.birthday_child_age,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
    }));
}

export async function restoreSessionBooking(historyId: number) {
    const res = await fetchAPI(`/bookings/session-booking-history/${historyId}/restore/`, {
        method: "POST"
    });

    if (!res) {
        return { success: false, error: "Network error" };
    }

    const data = await res.json();

    if (res.ok) {
        // Revalidate relevant paths
        revalidatePath("/admin/session-bookings/history");
        revalidatePath("/admin/bookings");
        revalidatePath("/admin/all-bookings");
        return {
            success: true,
            bookingId: data.booking_id,
            message: data.message
        };
    }

    return {
        success: false,
        error: data.error || "Failed to restore booking"
    };
}

export async function restorePartyBooking(historyId: number) {
    const res = await fetchAPI(`/bookings/party-booking-history/${historyId}/restore/`, {
        method: "POST"
    });

    if (!res) {
        return { success: false, error: "Network error" };
    }

    const data = await res.json();

    if (res.ok) {
        // Revalidate relevant paths
        revalidatePath("/admin/party-bookings/history");
        revalidatePath("/admin/party-bookings");
        revalidatePath("/admin/all-bookings");
        return {
            success: true,
            bookingId: data.booking_id,
            message: data.message
        };
    }

    return {
        success: false,
        error: data.error || "Failed to restore party booking"
    };
}

