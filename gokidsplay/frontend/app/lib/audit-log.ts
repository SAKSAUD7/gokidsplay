
import { getAdminSession } from "./admin-auth";
import { headers } from "next/headers";

export interface LogOptions {
    action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';
    entity: string;
    entityId?: string;
    details?: {
        before?: any;
        after?: any;
        changes?: string[];
        [key: string]: any;
    };
}

export async function logActivity(options: LogOptions): Promise<void> {
    try {
        const session = await getAdminSession();
        if (!session) return; // Skip logging if no session (or handle system actions differently)

        console.log(`[AUDIT] ${session.email} ${options.action} ${options.entity} ${options.entityId || ''}`, options.details);
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

/**
 * Helper to calculate changes between before/after objects
 */
export function calculateChanges(before: any, after: any): string[] {
    if (!before || !after) return [];

    const changes: string[] = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
        // Skip internal fields
        if (['updatedAt', 'createdAt'].includes(key)) continue;

        // Simple equality check (can be enhanced for deep comparison if needed)
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
            changes.push(key);
        }
    }

    return changes;
}
