"use server";

import { fetchAPI } from "../lib/server-api";
import { getAdminSession } from "../lib/admin-auth";
import { revalidatePath } from "next/cache";
import { transformCmsItem } from "../lib/transformers";

export async function getVouchers(): Promise<any[]> {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    try {
        const res = await fetchAPI("/shop/vouchers/");
        if (!res || !res.ok) return [];
        const data = await res.json();
        
        if (Array.isArray(data)) {
            return data.map(transformCmsItem);
        } else if (data && Array.isArray(data.results)) {
            return data.results.map(transformCmsItem);
        }
        
        console.warn("[getVouchers] Unexpected data format:", data);
        return [];
    } catch (error) {
        console.error("[getVouchers] Error fetching vouchers:", error);
        return [];
    }
}

export async function getVoucher(id: string) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    try {
        const res = await fetchAPI(`/shop/vouchers/${id}/`);
        if (!res || !res.ok) return null;
        const data = await res.json();
        return transformCmsItem(data);
    } catch (error) {
        console.error(`[getVoucher] Error fetching voucher ${id}:`, error);
        return null;
    }
}

export async function createVoucher(data: {
    code: string;
    discountType: string;
    discountValue: number;
    minOrderAmount?: number;
    expiryDate?: Date;
    usageLimit?: number;
    description?: string;
    minHoursBeforeSlot?: number;
}) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const payload = {
        code: data.code,
        discount_type: data.discountType,
        discount_value: Number(data.discountValue.toFixed(2)),
        min_order_amount: data.minOrderAmount ? Number(data.minOrderAmount.toFixed(2)) : null,
        expiry_date: data.expiryDate ? data.expiryDate.toISOString() : null,
        usage_limit: data.usageLimit || null,
        description: data.description || null,
        min_hours_before_slot: data.minHoursBeforeSlot || 0,
        is_active: true
    };

    const res = await fetchAPI("/shop/vouchers/", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to create voucher");
    }

    revalidatePath("/admin/vouchers");
}

export async function updateVoucher(id: string, data: {
    code?: string;
    discountType?: string;
    discountValue?: number;
    minOrderAmount?: number;
    expiryDate?: Date;
    usageLimit?: number;
    description?: string;
    isActive?: boolean;
    minHoursBeforeSlot?: number;
}) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const payload: any = {};
    if (data.code !== undefined) payload.code = data.code;
    if (data.discountType !== undefined) payload.discount_type = data.discountType;
    if (data.discountValue !== undefined) payload.discount_value = Number(data.discountValue.toFixed(2));
    if (data.minOrderAmount !== undefined) payload.min_order_amount = data.minOrderAmount ? Number(data.minOrderAmount.toFixed(2)) : null;
    if (data.expiryDate !== undefined) payload.expiry_date = data.expiryDate ? data.expiryDate.toISOString() : null;
    if (data.usageLimit !== undefined) payload.usage_limit = data.usageLimit;
    if (data.description !== undefined) payload.description = data.description;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    if (data.minHoursBeforeSlot !== undefined) payload.min_hours_before_slot = data.minHoursBeforeSlot;

    const res = await fetchAPI(`/shop/vouchers/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to update voucher");
    }

    revalidatePath("/admin/vouchers");
}

export async function deleteVoucher(id: string) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const res = await fetchAPI(`/shop/vouchers/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) {
        throw new Error("Failed to delete voucher");
    }

    revalidatePath("/admin/vouchers");
}

export async function validateVoucher(code: string, orderAmount: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1'}/shop/vouchers/validate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase(), order_amount: orderAmount })
    });

    if (!res.ok) {
        const error = await res.json();
        return { valid: false, error: error.error || "Failed to validate voucher" };
    }

    return await res.json();
}
