"use client";

import { X, AlertTriangle } from "lucide-react";

interface RestoreConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    bookingData: {
        id: number;
        name: string;
        email: string;
        date: string;
        time: string;
        amount: number;
        type: "session" | "party";
    };
    loading: boolean;
}

export function RestoreConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    bookingData,
    loading
}: RestoreConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Confirm Restore</h3>
                            <p className="text-sm text-slate-500">This action cannot be undone</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Warning Message */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800 font-medium">
                        ⚠️ Warning: Restoring this booking will move it to the Manual {bookingData.type === "session" ? "Session" : "Party"} Booking page.
                        The history record will be permanently marked as restored.
                    </p>
                </div>

                {/* Booking Details */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Booking Details</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600">ID:</span>
                            <span className="font-medium text-slate-900">#{bookingData.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Customer:</span>
                            <span className="font-medium text-slate-900">{bookingData.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Email:</span>
                            <span className="font-medium text-slate-900">{bookingData.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Date:</span>
                            <span className="font-medium text-slate-900">{bookingData.date}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Time:</span>
                            <span className="font-medium text-slate-900">{bookingData.time}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Amount:</span>
                            <span className="font-bold text-slate-900">£{bookingData.amount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Restoring...
                            </>
                        ) : (
                            "Confirm Restore"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
