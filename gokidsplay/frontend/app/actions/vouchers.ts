"use server";

import { fetchAPI } from "../lib/server-api";
import { getAdminSession } from "../lib/admin-auth";
import { revalidatePath } from "next/cache";
import { transformCmsItem } from "../lib/transformers";

export interface VoucherInput {
    code?: string;
    discountType?: string;
    discountValue?: number;
    minOrderAmount?: number | null;
    maxDiscountAmount?: number | null;
    validFrom?: string | null;   // ISO date-time
    expiryDate?: string | null;  // ISO date-time
    usageLimit?: number | null;
    maxUsesPerCustomer?: number | null;
    appliesTo?: "ALL" | "SESSION" | "PARTY";
    minHoursBeforeSlot?: number;
    description?: string | null;
    isActive?: boolean;
}

/** camelCase form values → API fields (only the ones given). */
function toPayload(data: VoucherInput) {
    const money = (v: number | null | undefined) => (v === null || v === undefined || Number.isNaN(v) ? null : Number(v.toFixed(2)));
    const count = (v: number | null | undefined) => (v === null || v === undefined || Number.isNaN(v) || v <= 0 ? null : Math.floor(v));
    const map: [keyof VoucherInput, string, (v: any) => any][] = [
        ["code", "code", v => String(v).trim().toUpperCase()],
        ["discountType", "discount_type", v => v],
        ["discountValue", "discount_value", money],
        ["minOrderAmount", "min_order_amount", money],
        ["maxDiscountAmount", "max_discount_amount", money],
        ["validFrom", "valid_from", v => v || null],
        ["expiryDate", "expiry_date", v => v || null],
        ["usageLimit", "usage_limit", count],
        ["maxUsesPerCustomer", "max_uses_per_customer", count],
        ["appliesTo", "applies_to", v => v],
        ["minHoursBeforeSlot", "min_hours_before_slot", v => Math.max(0, Math.floor(Number(v) || 0))],
        ["description", "description", v => v || null],
        ["isActive", "is_active", v => !!v],
    ];
    const payload: Record<string, any> = {};
    for (const [key, field, convert] of map) {
        if (data[key] !== undefined) payload[field] = convert(data[key]);
    }
    return payload;
}

/** The API's field errors as one readable line. */
async function errorMessage(res: Response | null, fallback: string) {
    const body = await res?.json().catch(() => null);
    if (!body) return fallback;
    if (body.detail || body.error) return body.detail || body.error;
    const first = Object.entries(body)[0];
    if (first) {
        const [field, msgs] = first;
        return `${field.replace(/_/g, " ")}: ${Array.isArray(msgs) ? msgs[0] : msgs}`;
    }
    return fallback;
}

export async function getVouchers(): Promise<any[]> {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    try {
        const res = await fetchAPI("/shop/vouchers/");
        if (!res || !res.ok) return [];
        const data = await res.json();
        const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        return rows.map(transformCmsItem);
    } catch (error) {
        console.error("[getVouchers] Error fetching vouchers:", error);
        return [];
    }
}

export async function getVoucher(id: string) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");
    if (!/^\d+$/.test(id)) return null;

    try {
        const res = await fetchAPI(`/shop/vouchers/${id}/`);
        if (!res || !res.ok) return null;
        return transformCmsItem(await res.json());
    } catch (error) {
        console.error(`[getVoucher] Error fetching voucher ${id}:`, error);
        return null;
    }
}

/** Every booking that used this voucher (with booking numbers). */
export async function getVoucherRedemptions(id: string): Promise<any[]> {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");
    if (!/^\d+$/.test(id)) return [];
    const res = await fetchAPI(`/shop/vouchers/${id}/redemptions/`);
    if (!res || !res.ok) return [];
    return res.json();
}

export async function createVoucher(data: VoucherInput) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const res = await fetchAPI("/shop/vouchers/", {
        method: "POST",
        body: JSON.stringify({ is_active: true, applies_to: "ALL", ...toPayload(data) }),
    });
    if (!res || !res.ok) return { ok: false as const, error: await errorMessage(res, "Failed to create voucher") };
    revalidatePath("/admin/vouchers");
    return { ok: true as const };
}

export async function updateVoucher(id: string, data: VoucherInput) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const res = await fetchAPI(`/shop/vouchers/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(toPayload(data)),
    });
    if (!res || !res.ok) return { ok: false as const, error: await errorMessage(res, "Failed to update voucher") };
    revalidatePath("/admin/vouchers");
    return { ok: true as const };
}

export async function setVoucherActive(id: string, isActive: boolean) {
    return updateVoucher(id, { isActive });
}

export async function deleteVoucher(id: string) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const res = await fetchAPI(`/shop/vouchers/${id}/`, { method: "DELETE" });
    if (!res || !res.ok) return { ok: false as const, error: await errorMessage(res, "Failed to delete voucher") };
    revalidatePath("/admin/vouchers");
    return { ok: true as const };
}

/** Make a batch of single-use codes (e.g. for a promotion or gift cards). */
export async function generateVouchers(data: VoucherInput & { prefix: string; count: number }) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const { prefix, count, ...rest } = data;
    const res = await fetchAPI("/shop/vouchers/generate/", {
        method: "POST",
        body: JSON.stringify({ prefix, count, ...toPayload(rest) }),
    });
    if (!res || !res.ok) return { ok: false as const, error: await errorMessage(res, "Failed to generate codes") };
    revalidatePath("/admin/vouchers");
    const made: { batch: string; count: number; codes: string[] } = await res.json();
    return { ok: true as const, ...made };
}
