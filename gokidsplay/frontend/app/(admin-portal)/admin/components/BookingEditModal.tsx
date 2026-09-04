"use client";

import { useState } from "react";
import { X, Edit } from "lucide-react";
import { updateBookingDetails, updateBookingStatus } from "@/app/actions/admin";

interface BookingEditModalProps {
    booking: any;
    onClose?: () => void;
}

export default function BookingEditModal({ booking, onClose }: BookingEditModalProps) {
    const [isOpen, setIsOpen] = useState(onClose ? true : false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: booking.date,
        time: booking.time,
        guests: booking.guests,
        amount: booking.totalAmount,
        status: booking.status
    });

    const handleStatusUpdate = async (newStatus: string) => {
        setIsLoading(true);
        try {
            await updateBookingStatus(booking.id, newStatus);
            setFormData({ ...formData, status: newStatus });
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateBookingDetails(booking.id, {
                ...formData,
                guests: parseInt(formData.guests.toString()),
                amount: parseFloat(formData.amount.toString())
            });
            setIsOpen(false);
            window.location.reload(); // Refresh to show updated data
        } catch (error) {
            console.error("Failed to update booking", error);
            alert("Failed to update booking");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-slate-400 hover:text-neon-blue hover:bg-slate-100 rounded-lg transition-colors"
                title="Edit Booking"
            >
                <Edit size={18} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setIsOpen(false); onClose?.(); }}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">Edit Booking</h3>
                            <button onClick={() => { setIsOpen(false); onClose?.(); }} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-neon-blue outline-none text-slate-900"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-neon-blue outline-none text-slate-900"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                                    <input
                                        type="number"
                                        value={formData.guests}
                                        onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-neon-blue outline-none text-slate-900"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-neon-blue outline-none text-slate-900"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Booking Status</label>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => handleStatusUpdate("CONFIRMED")}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${formData.status === "CONFIRMED"
                                            ? "bg-green-500 text-white"
                                            : "bg-green-100 text-green-700 hover:bg-green-200"
                                            }`}
                                        disabled={isLoading}
                                    >
                                        Confirmed
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStatusUpdate("PENDING")}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${formData.status === "PENDING"
                                            ? "bg-yellow-500 text-white"
                                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                            }`}
                                        disabled={isLoading}
                                    >
                                        Pending
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStatusUpdate("COMPLETED")}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${formData.status === "COMPLETED"
                                            ? "bg-blue-500 text-white"
                                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                            }`}
                                        disabled={isLoading}
                                    >
                                        Completed
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStatusUpdate("CANCELLED")}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${formData.status === "CANCELLED"
                                            ? "bg-red-500 text-white"
                                            : "bg-red-100 text-red-700 hover:bg-red-200"
                                            }`}
                                        disabled={isLoading}
                                    >
                                        Cancelled
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-white bg-neon-blue hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
