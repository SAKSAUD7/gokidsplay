import { cookies } from 'next/headers';
import { hasPermission, type Permission } from './permissions';
import * as fs from 'fs';
import * as path from 'path';

// Use 127.0.0.1 for server-side requests to avoid Node.js 18+ IPv6 resolution issues
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace('localhost', '127.0.0.1');

export interface AdminSession {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions?: Permission[];
}

export async function getAdminSession(): Promise<AdminSession | null> {
    const token = cookies().get('admin_token')?.value;

    // DEBUG LOG
    try {
        const logPath = path.join(process.cwd(), 'auth_debug.log');
        const time = new Date().toISOString();
        const msg = `[${time}] getAdminSession - Token: ${!!token ? 'Present' : 'Missing'} - URL: ${API_URL}/core/users/me/\n`;
        fs.appendFileSync(logPath, msg);
    } catch (e) { console.error("Log failed", e); }

    if (!token) return null;

    try {
        const res = await fetch(`${API_URL}/core/users/me/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            },
            cache: "no-store"
        });

        // DEBUG LOG
        try {
            const logPath = path.join(process.cwd(), 'auth_debug.log');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] Response: ${res.status}\n`);
            if (!res.ok) {
                const clone = res.clone();
                const text = await clone.text();
                fs.appendFileSync(logPath, `[${new Date().toISOString()}] Error: ${text}\n`);
            }
        } catch (e) { console.error("Log failed", e); }

        if (!res.ok) return null;

        const user = await res.json();

        // Map roles to permissions
        let permissions: Permission[] = [];

        if (user.role === 'ADMIN') {
            // ADMIN: Full Access to Everything
            permissions = ['*:*'];
        } else if (user.role === 'CONTENT_MANAGER') {
            // CONTENT_MANAGER: CMS Management ONLY
            permissions = [
                'cms:read',
                'cms:write',
                'cms:delete',
            ];
        } else if (user.role === 'STAFF') {
            // STAFF: Booking Management ONLY
            permissions = [
                'dashboard:read',
                'bookings:read',
                'bookings:write',
                'bookings:delete',
                'waivers:read',
                'waivers:write',
                'customers:read',
                'parties:read',
                'parties:write',
                'parties:delete',
                'messages:read',
                'messages:write',
                'entries:read',
                'entries:write',
            ];
        } else if (user.role === 'MANAGER') {
            // MANAGER: Booking + Dashboard access
            permissions = [
                'dashboard:read',
                'bookings:read',
                'bookings:write',
                'waivers:read',
                'waivers:write',
                'customers:read',
                'parties:read',
                'parties:write',
            ];
        } else if (user.role === 'EMPLOYEE') {
            // EMPLOYEE: Basic booking access
            permissions = [
                'dashboard:read',
                'bookings:read',
                'waivers:read',
            ];
        } else {
            // Fallback: Minimal access
            permissions = ['dashboard:read'];
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions
        };
    } catch (error) {
        return null;
    }
}

import { redirect } from 'next/navigation';

/**
 * Require a specific permission for server actions
 * Throws error if user doesn't have permission
 */
export async function requirePermission(
    entity: string,
    action: 'read' | 'write' | 'delete'
): Promise<void> {
    const session = await getAdminSession();
    if (!session) {
        redirect('/admin/login');
    }

    // Superusers with wildcard permission (*:*) have access to everything
    if (session.permissions?.includes('*:*')) {
        return;
    }

    if (!hasPermission(session.permissions || [], { entity, action })) {
        // Keeps the error for specialized permission failure (logged in but unauthorized)
        // Or could redirect to a 403 page
        throw new Error(`Forbidden: Missing ${entity}:${action} permission`);
    }
}
