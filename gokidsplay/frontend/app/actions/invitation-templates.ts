"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";
import { revalidatePath } from "next/cache";

export async function getInvitationTemplates(): Promise<any[]> {
    await requirePermission('cms', 'read');
    const res = await fetchAPI('/invitations/templates/');
    if (!res.ok) return [];
    return await res.json();
}

export async function getInvitationTemplate(id: number) {
    await requirePermission('cms', 'read');
    const res = await fetchAPI(`/invitations/templates/${id}/`);
    if (!res.ok) return null;
    return await res.json();
}

export async function createInvitationTemplate(data: FormData) {
    console.log("=== SERVER ACTION: createInvitationTemplate ===");
    await requirePermission('cms', 'write');
    console.log("Permission check passed");

    // Log FormData contents
    console.log("FormData contents:");
    for (const [key, value] of data.entries()) {
        if (value instanceof File) {
            console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
            console.log(`  ${key}: ${value}`);
        }
    }

    const res = await fetchAPI('/invitations/templates/', {
        method: 'POST',
        body: data,
    });

    console.log("API Response status:", res.status);
    console.log("API Response ok:", res.ok);

    if (res.ok) {
        const responseData = await res.json();
        console.log("Success! Created template:", responseData);
        revalidatePath("/admin/invitations");
        return { success: true };
    }

    if (!res.ok) {
        let errorMessage;
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            try {
                const error = await res.json();
                errorMessage = error.detail || "Failed to create template";
            } catch (e) {
                errorMessage = "Failed to parse error response";
            }
        } else {
            const text = await res.text();
            errorMessage = `Request failed (${res.status}): ${text.slice(0, 200)}...`;
            console.error('[createInvitationTemplate] Non-JSON error:', text);
        }
        throw new Error(errorMessage);
    }
}

export async function updateInvitationTemplate(id: number, data: FormData) {
    await requirePermission('cms', 'write');

    const res = await fetchAPI(`/invitations/templates/${id}/`, {
        method: 'PATCH', // or PUT
        body: data,
    });

    if (res.ok) {
        revalidatePath("/admin/invitations");
        revalidatePath(`/admin/invitations/${id}`);
        return { success: true };
    }

    if (!res.ok) {
        let errorMessage;
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            try {
                const error = await res.json();
                errorMessage = error.detail || "Failed to update template";
            } catch (e) {
                errorMessage = "Failed to parse error response";
            }
        } else {
            const text = await res.text();
            errorMessage = `Request failed (${res.status}): ${text.slice(0, 200)}...`;
            console.error('[updateInvitationTemplate] Non-JSON error:', text);
        }
        throw new Error(errorMessage);
    }
}

export async function deleteInvitationTemplate(id: number) {
    await requirePermission('cms', 'delete');

    const res = await fetchAPI(`/invitations/templates/${id}/`, {
        method: 'DELETE',
    });

    if (res.ok) {
        revalidatePath("/admin/invitations");
        return { success: true };
    }

    const error = await res.json();
    throw new Error(error.detail || "Failed to delete template");
}
