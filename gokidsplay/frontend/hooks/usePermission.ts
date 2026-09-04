"use client";

import { useEffect, useState } from 'react';

export function usePermission(entity: string, action: 'read' | 'write' | 'delete') {
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkPermission() {
            try {
                const res = await fetch('/api/admin/session');
                if (!res.ok) throw new Error('Failed to fetch session');

                const session = await res.json();

                if (session?.permissions) {
                    const allowed = session.permissions.some((p: string) =>
                        p === `${entity}:*` || p === `${entity}:${action}` || p === '*:*'
                    );
                    setHasAccess(allowed);
                }
            } catch {
                setHasAccess(false);
            } finally {
                setLoading(false);
            }
        }

        checkPermission();
    }, [entity, action]);

    return { hasAccess, loading };
}
