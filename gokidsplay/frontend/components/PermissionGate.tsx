"use client";

import { usePermission } from "../hooks/usePermission";

interface PermissionGateProps {
    entity: string;
    action: 'read' | 'write' | 'delete';
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function PermissionGate({ entity, action, children, fallback }: PermissionGateProps) {
    const { hasAccess, loading } = usePermission(entity, action);

    if (loading) return null; // Or a skeleton/spinner if preferred
    if (!hasAccess) return fallback || null;

    return <>{children}</>;
}
