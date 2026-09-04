"use server";

import { cookies } from "next/headers";

/**
 * Payment Stats Actions
 * 
 * Server actions for fetching payment analytics and statistics
 */

// Use 127.0.0.1 for server-side requests to avoid Node.js 18+ IPv6 resolution issues
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace("localhost", "127.0.0.1");

export async function getPaymentStats() {
    try {
        const token = cookies().get("admin_token")?.value;

        if (!token) {
            console.error("[PaymentStats] No admin_token cookie found — returning defaults");
            return getDefaultStats();
        }

        const response = await fetch(`${API_URL}/payments/stats/`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error("Failed to fetch payment stats:", response.statusText);
            return getDefaultStats();
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching payment stats:", error);
        return getDefaultStats();
    }
}

function getDefaultStats() {
    return {
        total_payments: 0,
        successful_payments: 0,
        failed_payments: 0,
        total_refunds: 0,
        total_revenue: 0,
        today_revenue: 0,
        this_week_revenue: 0,
        this_month_revenue: 0,
        avg_transaction_value: 0,
        success_rate: 0,
        recent_payments: [],
        payment_methods: {
            MOCK: 0,
            RAZORPAY: 0
        },
        daily_revenue: []
    };
}
