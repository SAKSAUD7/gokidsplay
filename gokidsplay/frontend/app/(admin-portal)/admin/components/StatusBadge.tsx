"use client";

import { cn } from "@repo/ui";

interface StatusBadgeProps {
    status: string;
    type?: "booking" | "payment" | "waiver";
}

export function StatusBadge({ status, type = "booking" }: StatusBadgeProps) {
    const getStyles = (status: string) => {
        if (!status) return "bg-slate-100 text-slate-700 border-slate-200";
        const s = status.toUpperCase();

        switch (s) {
            // Booking Status
            case "CONFIRMED":
            case "COMPLETED":
            case "PAID":
            case "SIGNED":
                return "bg-green-100 text-green-700 border-green-200";
            case "PENDING":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "CANCELLED":
            case "FAILED":
            case "REFUNDED":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-medium border",
            getStyles(status)
        )}>
            {status || "PENDING"}
        </span>
    );
}
