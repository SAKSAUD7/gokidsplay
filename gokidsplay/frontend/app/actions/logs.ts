"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";

export async function getAuditLogs(filter?: {
    search?: string;
    user?: string;
    entity?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
}): Promise<any[]> {
    await requirePermission('logs', 'read');
    const params = new URLSearchParams();
    if (filter?.search) params.set('search', filter.search);
    if (filter?.user) params.set('user', filter.user);
    if (filter?.entity) params.set('entity', filter.entity);
    if (filter?.action) params.set('action', filter.action);
    if (filter?.fromDate) params.set('from', filter.fromDate);
    if (filter?.toDate) params.set('to', filter.toDate);
    params.set('limit', String(filter?.limit ?? 300));
    // Recorded by the backend (apps/core/activity.py) for every admin change and sign-in
    const res = await fetchAPI(`/core/activity-logs/?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : [];
}

export async function getLogStats(): Promise<any> {
    const res = await fetchAPI('/core/activity-logs/stats/');
    if (!res.ok) return { totalLogs: 0, logsToday: 0, last7Days: 0, failedLogins7Days: 0, actionsByType: [], entities: [] };
    return res.json();
}
