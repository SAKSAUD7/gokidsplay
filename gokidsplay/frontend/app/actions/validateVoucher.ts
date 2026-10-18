"use server";

import { clientIpHeaders } from "@/app/lib/client-ip";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

/** Check a voucher code in the booking wizards. The discount is in pounds. */
export async function validateVoucher(
    code: string,
    orderAmount: number,
    bookingDateTime?: string, // ISO format: "2026-01-12T15:30:00"
    bookingType?: "session" | "party",
    email?: string,
) {
    try {
        const clean = String(code || "").trim().toUpperCase().slice(0, 50);
        if (!clean) {
            return { success: false, error: "Voucher code is required" };
        }

        const response = await fetch(`${API_URL}/shop/vouchers/validate/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...clientIpHeaders() },
            body: JSON.stringify({
                code: clean,
                order_amount: orderAmount,
                booking_datetime: bookingDateTime,
                booking_type: bookingType,
                email: email || undefined,
            }),
            cache: "no-store",
        });

        if (response.status === 429) {
            return { success: false, error: "Too many attempts. Please wait a minute and try again." };
        }
        const result = await response.json().catch(() => ({}));

        if (!result.valid) {
            return { success: false, error: result.error || "Invalid voucher" };
        }

        return {
            success: true,
            discount: result.discount_amount as number,
            finalAmount: result.final_amount as number,
            type: result.voucher.discount_type,
            value: result.voucher.discount_value,
            code: result.voucher.code as string,
            description: result.voucher.description,
        };
    } catch (error) {
        console.error("Voucher validation error:", error);
        return { success: false, error: "Failed to validate voucher" };
    }
}
