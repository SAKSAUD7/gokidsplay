"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page redirects to the correct Session Bookings implementation at /admin/bookings
// Kept for backward compatibility with old links
export default function SessionBookingsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/bookings");
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-slate-600">Redirecting to Session Bookings...</p>
            </div>
        </div>
    );
}
