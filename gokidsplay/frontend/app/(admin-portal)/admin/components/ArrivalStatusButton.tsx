"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

interface ArrivalStatusButtonProps {
    bookingId: number | string;
    isArrived: boolean;
    onToggle: (id: string, currentStatus: boolean) => Promise<boolean>;
    type?: 'session' | 'party';
}

export function ArrivalStatusButton({ bookingId, isArrived, onToggle }: ArrivalStatusButtonProps) {
    const [loading, setLoading] = useState(false);

    async function handleClick() {
        setLoading(true);
        try {
            await onToggle(String(bookingId), isArrived);
        } catch (error) {
            console.error("Error toggling arrival status:", error);
            toast.error("Failed to update status");
        } finally {
            setLoading(false);
        }
    }

    if (isArrived) {
        return (
            <div className="flex flex-col items-start gap-1">
                <span className="text-emerald-600 font-bold text-sm">Arrived</span>
                <button
                    onClick={handleClick}
                    disabled={loading}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <X size={12} className="stroke-[3]" />
                    )}
                    Set Not Arrived
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-start gap-1">
            <span className="text-red-500 font-bold text-sm">Not Arrived</span>
            <button
                onClick={handleClick}
                disabled={loading}
                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50"
            >
                {loading ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Check size={12} className="stroke-[3]" />
                )}
                Set Arrived
            </button>
        </div>
    );
}
