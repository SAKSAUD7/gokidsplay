"use client";

import { useState } from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

interface ArrivedToggleProps {
    bookingId: number | string;
    arrived: boolean;
    onToggle: (id: number | string, newStatus: boolean) => Promise<void>;
    type?: 'session' | 'party';
}

export const ArrivedToggle = ({ bookingId, arrived, onToggle, type = 'session' }: ArrivedToggleProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(arrived);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click

        if (isLoading) return;

        setIsLoading(true);
        try {
            await onToggle(bookingId, !currentStatus);
            setCurrentStatus(!currentStatus);
        } catch (error) {
            console.error('Failed to toggle arrived status:', error);
            // Optionally show error toast
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium cursor-wait">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
            </div>
        );
    }

    if (currentStatus) {
        // Once arrived, show as permanent badge (non-clickable)
        return (
            <div
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-sm font-semibold shadow-sm cursor-default"
                title="Customer has arrived"
            >
                <CheckCircle className="w-4 h-4 fill-current" />
                <span>Arrived</span>
            </div>
        );
    }

    return (
        <button
            onClick={handleToggle}
            className="flex items-center gap-2 px-3 py-1.5 border-2 border-slate-300 text-slate-600 bg-white rounded-full text-sm font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
            title="Click to mark as arrived"
        >
            <Circle className="w-4 h-4" />
            <span>Mark Arrived</span>
        </button>
    );
};
