"use server";

/**
 * Payment Actions — SumUp Integration (Live)
 *
 * Dual-merchant routing:
 *   - roller-skating / arcade → Go Kids Play Ltd account
 *   - ten-pin-bowling         → Twinkle Town Ltd account
 *
 * Calls through internal Next.js proxy (/api/payments/*) to avoid
 * mixed-content (HTTPS→HTTP) issues in production on Azure.
 */

// Internal proxy routes — always relative, always same-origin, always HTTPS
const PROXY_BASE = "/api/payments";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export interface PaymentOrderData {
    booking_id: number;
    booking_type: "session" | "party";
    amount?: number;
}

export interface PaymentVerificationData {
    order_id: string;
}

export interface PaymentOrderResult {
    success: boolean;
    provider?: string;
    order_id?: string;
    checkout_url?: string;
    merchant?: string;
    amount?: number;
    currency?: string;
    error?: string;
    message?: string;
}

/**
 * Create a SumUp payment checkout.
 *
 * Calls POST /api/v1/payments/create-order on the Django backend.
 * The backend automatically selects the correct SumUp merchant
 * (Go Kids Play Ltd or Twinkle Town Ltd) based on the booking's activity.
 *
 * Returns { checkout_url } — redirect the user to this URL.
 */
export async function createPaymentOrder(
    data: PaymentOrderData
): Promise<PaymentOrderResult> {
    try {
        // Use internal Next.js proxy to avoid mixed-content issues
        const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL
            || (typeof window !== 'undefined' ? window.location.origin : '');
        const url = baseUrl
            ? `${baseUrl}${PROXY_BASE}/create-order`
            : `${(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1').replace('localhost', '127.0.0.1')}/payments/create-order/`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                booking_id:   data.booking_id,
                booking_type: data.booking_type,
                amount:       data.amount,
            }),
            cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Payment order creation failed:", result);
            return {
                success: false,
                error: result.error || "Failed to create payment order",
            };
        }

        return {
            success:      true,
            provider:     result.provider || "sumup",
            order_id:     result.order_id,
            checkout_url: result.checkout_url,
            merchant:     result.merchant,
            amount:       result.amount,
            currency:     result.currency,
        };
    } catch (error) {
        console.error("Error creating payment order:", error);
        return {
            success: false,
            error:   error instanceof Error ? error.message : "Network error",
        };
    }
}

/**
 * Verify a SumUp payment after redirect.
 *
 * Calls POST /api/v1/payments/verify on the Django backend.
 * The backend polls SumUp API to confirm the payment status
 * and updates the booking's payment_status field.
 */
export async function verifyPayment(data: PaymentVerificationData) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL
            || (typeof window !== 'undefined' ? window.location.origin : '');
        const url = baseUrl
            ? `${baseUrl}${PROXY_BASE}/verify`
            : `${(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api/v1').replace('localhost', '127.0.0.1')}/payments/verify/`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: data.order_id }),
            cache: "no-store",
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error verifying payment:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Verification failed",
        };
    }
}

/**
 * Get payment status for a booking.
 */
export async function getBookingPaymentStatus(
    bookingId: number,
    bookingType: "session" | "party"
) {
    try {
        const response = await fetch(
            `${API_URL}/payments/booking/${bookingId}/${bookingType}/status`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            return { success: false, payment_status: "UNKNOWN" };
        }

        return { success: true, ...(await response.json()) };
    } catch (error) {
        console.error("Error fetching payment status:", error);
        return { success: false, payment_status: "UNKNOWN" };
    }
}
