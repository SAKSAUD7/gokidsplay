"use server";

import { revalidatePath } from "next/cache";
import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";
import { logActivity } from "../lib/audit-log";
import { getManagedCollection } from "@/lib/cms/collections";

function collectionOrThrow(key: string) {
    const collection = getManagedCollection(key);
    if (!collection) throw new Error(`Unknown collection: ${key}`);
    return collection;
}

async function errorText(res: Response | undefined | null) {
    if (!res) return "No response from server";
    const body = await res.text().catch(() => "");
    try {
        const json = JSON.parse(body);
        if (json.detail) return String(json.detail);
        // DRF field errors: { field: ["message"] }
        return Object.entries(json).map(([field, msgs]) => `${field}: ${([] as any[]).concat(msgs).join(" ")}`).join("; ");
    } catch {
        return body.slice(0, 200) || `Request failed (${res.status})`;
    }
}

export async function getManagedItems(key: string): Promise<any[]> {
    const collection = collectionOrThrow(key);
    const res = await fetchAPI(collection.endpoint);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
}

export async function getManagedItem(key: string, id: string | number) {
    const collection = collectionOrThrow(key);
    const res = await fetchAPI(`${collection.endpoint}${id}/`);
    return res.ok ? res.json() : null;
}

export async function saveManagedItem(key: string, data: Record<string, any>, id?: string | number) {
    try {
        await requirePermission("cms", "write");
    } catch (error: any) {
        return { success: false, error: error.message || "Permission denied" };
    }
    const collection = collectionOrThrow(key);

    // Drop read-only fields the form may carry back
    const { id: _id, created_at, updated_at, ...payload } = data;
    const res = await fetchAPI(id ? `${collection.endpoint}${id}/` : collection.endpoint, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
    });
    if (!res.ok) return { success: false, error: await errorText(res) };

    const item = await res.json();
    await logActivity({
        action: id ? "UPDATE" : "CREATE",
        entity: collection.schema.name.toUpperCase().replace(/\s+/g, "_"),
        entityId: String(item.id),
        details: { after: item },
    });
    revalidatePath(collection.publicPath);
    revalidatePath(`/admin/cms/collections/${key}`);
    return { success: true, item };
}

export async function deleteManagedItem(key: string, id: string | number) {
    try {
        await requirePermission("cms", "delete");
    } catch (error: any) {
        return { success: false, error: error.message || "Permission denied" };
    }
    const collection = collectionOrThrow(key);
    const res = await fetchAPI(`${collection.endpoint}${id}/`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) return { success: false, error: await errorText(res) };

    await logActivity({
        action: "DELETE",
        entity: collection.schema.name.toUpperCase().replace(/\s+/g, "_"),
        entityId: String(id),
    });
    revalidatePath(collection.publicPath);
    revalidatePath(`/admin/cms/collections/${key}`);
    return { success: true };
}
