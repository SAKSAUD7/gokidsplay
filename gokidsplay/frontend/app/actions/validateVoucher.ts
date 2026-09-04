"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export async function validateVoucher(
    code: string,
    orderAmount: number,
    bookingDateTime?: string // ISO format: "2026-01-12T15:30:00"
) {
    try {
        if (!code) {
            return { success: false, error: "Voucher code is required" };
        }

        // Use backend validation endpoint
        const response = await fetch(`${API_URL}/shop/vouchers/validate/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code.toUpperCase(),
                order_amount: orderAmount,
                booking_datetime: bookingDateTime
            }),
            cache: "no-store"
        });

        const result = await response.json();

        if (!result.valid) {
            return {
                success: false,
                error: result.error || "Invalid voucher"
            };
        }

        return {
            success: true,
            discount: result.discount_amount,
            type: result.voucher.discount_type,
            value: result.voucher.discount_value,
            code: result.voucher.code,
            description: result.voucher.description
        };

    } catch (error) {
        console.error("Voucher validation error:", error);
        return { success: false, error: "Failed to validate voucher" };
    }
}
