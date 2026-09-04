"use client";

import { useState, useRef } from "react";
// We'll need to create this action later or use a generic update one
import { updateBooking } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Users, User, Mail, Phone, Info, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface AdminBookingFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function AdminBookingForm({ initialData, isEditing = false }: AdminBookingFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const formRef = useRef<HTMLFormElement>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(formRef.current!);
        setLoading(true);
        setError("");

        try {
            // Convert FormData to object for the action
            const data = {
                date: formData.get("date"),
                time: formData.get("time"),
                duration: Number(formData.get("duration")),
                adults: Number(formData.get("adults")),
                kids: Number(formData.get("kids")),
                spectators: Number(formData.get("spectators")),
                name: formData.get("name"),
                email: formData.get("email"),
                phone: formData.get("phone"),
                booking_status: formData.get("bookingStatus"),
                amount: formData.get("amount"), // Allow editing amount manually
                notes: formData.get("notes"),
            };

            let result;
            if (isEditing && initialData?.id) {
                result = await updateBooking(initialData.id, data);
            } else {
                // Handle creation if needed later, for now we assume edit only
                setError("Create functionality not yet implemented for session bookings via this form");
                setLoading(false);
                return;
            }

            if (result.success) {
                toast.success("Booking updated successfully");
                router.push("/admin/bookings");
                router.refresh();
            } else {
                setError(result.error || "Failed to update booking");
                toast.error(result.error || "Operation failed");
            }
        } catch (err) {
            setError("An unexpected error occurred");
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Customer Details */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Customer Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                name="name"
                                type="text"
                                required
                                defaultValue={initialData?.name}
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                name="email"
                                type="email"
                                required
                                defaultValue={initialData?.email}
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                name="phone"
                                type="tel"
                                required
                                defaultValue={initialData?.phone}
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                                placeholder="+44 7700 900000"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Details */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Booking Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                name="date"
                                type="date"
                                required
                                defaultValue={initialData?.date}
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Time Slot (Start)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                name="time"
                                type="time"
                                required
                                defaultValue={initialData?.time}
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                name="duration"
                                required
                                defaultValue={initialData?.duration || 60}
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-slate-900"
                            >
                                <option value="60">60 Minutes</option>
                                <option value="90">90 Minutes</option>
                                <option value="120">120 Minutes</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Guests */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Guest Count
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adults</label>
                        <input
                            name="adults"
                            type="number"
                            required
                            min="0"
                            defaultValue={initialData?.adults || 0}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kids</label>
                        <input
                            name="kids"
                            type="number"
                            required
                            min="0"
                            defaultValue={initialData?.kids || 0}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Spectators</label>
                        <input
                            name="spectators"
                            type="number"
                            required
                            min="0"
                            defaultValue={initialData?.spectators || 0}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                        />
                    </div>
                </div>
            </div>

            {/* Payment & Status */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Payment & Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount (£)</label>
                        <input
                            name="amount"
                            type="number"
                            step="0.01"
                            required
                            defaultValue={initialData?.amount}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                        />
                        <p className="text-xs text-slate-500 mt-1">Manually overriding amount does not process refunds/charges.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Booking Status</label>
                        <select
                            name="bookingStatus"
                            defaultValue={initialData?.booking_status}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                        >
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    Additional Information
                </h3>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Admin Notes</label>
                    <textarea
                        name="notes"
                        rows={3}
                        defaultValue={initialData?.notes}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                        placeholder="Internal notes..."
                    ></textarea>
                </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Booking" : "Create Booking")}
                </button>
            </div>
        </form>
    );
}
