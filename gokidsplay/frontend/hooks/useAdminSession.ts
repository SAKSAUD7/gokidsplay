"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * useAdminSession
 * 
 * Polls the /api/auth/refresh endpoint every 45 minutes to silently renew
 * the admin JWT access token before it expires (60-min lifetime).
 * 
 * If the refresh token is also expired, redirects the user to /admin/login
 * gracefully instead of crashing with "Failed to fetch".
 */
export function useAdminSession() {
    const router = useRouter();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Refresh 15 minutes before token expiry (access token = 60 min, we refresh at 45 min)
        const REFRESH_INTERVAL_MS = 45 * 60 * 1000;

        async function refresh() {
            try {
                const res = await fetch("/api/auth/refresh", {
                    method: "POST",
                    credentials: "include",
                });

                if (!res.ok) {
                    // Refresh token is also expired — redirect to login
                    console.warn("[useAdminSession] Session fully expired, redirecting to login");
                    router.push("/admin/login?reason=session_expired");
                }
            } catch (err) {
                console.error("[useAdminSession] Refresh check failed:", err);
                // Don't redirect on network errors — only on explicit 401
            }
        }

        // Start the polling interval
        intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [router]);
}
