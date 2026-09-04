"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";
import { revalidatePath } from "next/cache";

export async function getAdminUsers(): Promise<any[]> {
    await requirePermission('users', 'read');
    const res = await fetchAPI("/core/users/");
    if (!res || !res.ok) return [];
    const users = await res.json();
    return users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        profilePic: u.profile_pic,
        role: { name: u.role, id: u.role }, // Map string role to object for UI compatibility
        isActive: u.is_active,
        lastLoginAt: u.last_login
    }));
}

export async function getUserStats(): Promise<any> {
    await requirePermission('users', 'read');
    const res = await fetchAPI("/core/users/stats/");
    if (!res || !res.ok) {
        return {
            totalUsers: 0,
            activeUsers: 0,
            inactiveUsers: 0,
            recentLogins: 0,
            roleDistribution: []
        };
    }
    return res.json();
}

export async function getRecentActivity(limit: number = 5): Promise<any[]> {
    await requirePermission('users', 'read');
    const res = await fetchAPI(`/core/users/recent_activity/?limit=${limit}`);
    if (!res || !res.ok) return [];

    const users = await res.json();
    // Transform if necessary, or return as is (assumes user object structure)
    return users.map((u: any) => ({
        id: u.id,
        name: u.first_name ? `${u.first_name} ${u.last_name}` : u.username, // Adjust based on serializer
        role: u.role,
        lastLoginAt: u.last_login
    }));
}

export async function getUser(id: string) {
    await requirePermission('users', 'read');
    const res = await fetchAPI(`/core/users/${id}/`);
    if (!res || !res.ok) return null;
    return await res.json();
}

export async function updateUser(id: string, data: {
    name?: string;
    email?: string;
    role?: string;
    password?: string;
    is_active?: boolean;
}) {
    await requirePermission('users', 'write');

    const res = await fetchAPI(`/core/users/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

    if (!res || !res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to update user");
    }

    revalidatePath("/admin/users");
}

export async function deleteUser(id: string) {
    await requirePermission('users', 'delete');

    const res = await fetchAPI(`/core/users/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) {
        throw new Error("Failed to delete user");
    }

    revalidatePath("/admin/users");
}

export async function createAdminUser(data: any) {
    await requirePermission('users', 'write');

    // Generate username from email if not provided
    const username = data.username || data.email.split('@')[0];

    const payload = {
        username,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role
    };

    const res = await fetchAPI("/core/users/", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) {
        let errorMessage;
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            try {
                const error = await res.json();
                errorMessage = error.detail ||
                    (error.email ? `Email: ${error.email[0]}` : null) ||
                    (error.username ? `Username: ${error.username[0]}` : null) ||
                    (error.password ? `Password: ${error.password[0]}` : null) ||
                    (error.role ? `Role: ${error.role[0]}` : null) ||
                    Object.values(error).flat().join(', ') ||
                    "Failed to create user";
            } catch (e) {
                errorMessage = "Failed to parse error response";
            }
        } else {
            const text = await res.text();
            errorMessage = `Request failed (${res.status}): ${text.slice(0, 200)}...`;
            console.error('[createAdminUser] Non-JSON error:', text);
        }
        throw new Error(errorMessage);
    }

    revalidatePath("/admin/users");
    return await res.json();
}

export async function getRoles(): Promise<any[]> {
    return [
        { id: 'ADMIN', name: 'Admin', description: 'Full access to everything' },
        { id: 'MANAGER', name: 'Manager', description: 'Booking and dashboard access' },
        { id: 'CONTENT_MANAGER', name: 'Content Manager', description: 'CMS management only' },
        { id: 'STAFF', name: 'Staff', description: 'Booking management only' },
        { id: 'EMPLOYEE', name: 'Employee', description: 'Read-only access to bookings' }
    ];
}

export async function getAdminUser(id: string) {
    return getUser(id);
}

export async function updateAdminUser(id: string, data: any) {
    return updateUser(id, data);
}

export async function deleteAdminUser(id: string) {
    return deleteUser(id);
}

export async function resetAdminPassword(id: string, new_password: string) {
    // Only users with write access to 'users' can reset passwords (typically ADMINs as per our RBAC)
    await requirePermission('users', 'write');

    const res = await fetchAPI(`/core/users/${id}/reset_password/`, {
        method: "POST",
        body: JSON.stringify({ new_password })
    });

    if (!res || !res.ok) {
        try {
            const error = await res.json();
            throw new Error(error.error || error.detail || "Failed to reset password");
        } catch (e) {
            throw new Error("Failed to reset password");
        }
    }

    return await res.json();
}
