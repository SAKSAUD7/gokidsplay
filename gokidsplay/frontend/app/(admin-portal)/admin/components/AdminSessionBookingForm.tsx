"use client";

import { useState, useRef } from "react";
import { createBooking } from "@/app/actions/createBooking";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Users, User, Mail, Phone, Info } from "lucide-react";

export function AdminSessionBookingForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitType, setSubmitType] = useState<'later' | 'sumup'>('later');
    const [error, setError] = useState("");
    const formRef = useRef<HTMLFormElement>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(formRef.current!);

        try {
            // Convert FormData to object for the action
            const data = {
                date: formData.get("date"),
                time: formData.get("time"),
                duration: formData.get("duration"),
                adults: Number(formData.get("adults")),
                kids: Number(formData.get("kids")),
                spectators: Number(formData.get("spectators")),
                name: formData.get("name"),
                email: formData.get("email"),
                phone: formData.get("phone"),
                activity: formData.get("activity") || "roller-skating",
            };

            const result = await createBooking(data);

            if (result.success) {
                if (submitType === 'sumup' && result.bookingIntId) {
                    try {
                        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
                        const res = await fetch(`${API}/payments/create-order/`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                booking_id: result.bookingIntId,
                                booking_type: "session",
                                amount: result.amount || 0, // Fallback, backend handles total
                            }),
                            cache: "no-store",
                        });
                        const sumupData = await res.json();
                        if (res.ok && sumupData.checkout_url) {
                            window.location.href = sumupData.checkout_url;
                            return; // Don't redirect to admin bookings list yet
                        } else {
                            setError(sumupData.error || "Booking created, but SumUp payment failed to initialize.");
                        }
                    } catch (paymentErr) {
                        setError("Booking created, but failed to connect to payment gateway.");
                    }
                } else {
                    router.push("/admin/bookings");
                    router.refresh();
                }
            } else {
                setError(result.error || "Failed to create booking");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            if (submitType !== 'sumup' || error) {
                setLoading(false);
            }
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
                    <User className="w-5 h-5 text-primary" />
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
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder:text-slate-400"
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
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder:text-slate-400"
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
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder:text-slate-400"
                                placeholder="+44 7700 900000"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Details */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
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
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Time Slot</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                name="time"
                                required
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white text-slate-900"
                            >
                                <option value="">Select Time</option>
                                <option value="12:00">12:00 PM (Noon)</option>
                                <option value="13:00">01:00 PM</option>
                                <option value="14:00">02:00 PM</option>
                                <option value="15:00">03:00 PM</option>
                                <option value="16:00">04:00 PM</option>
                                <option value="17:00">05:00 PM</option>
                                <option value="18:00">06:00 PM</option>
                                <option value="19:00">07:00 PM</option>
                                <option value="20:00">08:00 PM (Fri/Sat only)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                        <select
                            name="duration"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-slate-900"
                        >
                            <option value="60">60 Minutes</option>
                            <option value="90">90 Minutes</option>
                            <option value="120">120 Minutes</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Activity Type</label>
                        <select
                            name="activity"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-slate-900"
                        >
                            <option value="roller-skating">🛼 Roller Skating</option>
                            <option value="ten-pin-bowling">🎳 Ten Pin Bowling</option>
                            <option value="combined">🎯 Skating + Bowling</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Guests */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Guest Count
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kids</label>
                        <input
                            name="kids"
                            type="number"
                            required
                            min="0"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder:text-slate-400"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adults</label>
                        <input
                            name="adults"
                            type="number"
                            required
                            min="0"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder:text-slate-400"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Spectators</label>
                        <input
                            name="spectators"
                            type="number"
                            required
                            min="0"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder:text-slate-400"
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                    type="submit"
                    onClick={() => setSubmitType('later')}
                    disabled={loading}
                    className="px-6 py-2 bg-white text-slate-700 border border-slate-300 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading && submitType === 'later' ? "Creating..." : "Create (Pay Later / Cash)"}
                </button>
                <button
                    type="submit"
                    onClick={() => setSubmitType('sumup')}
                    disabled={loading}
                    className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading && submitType === 'sumup' ? "Redirecting to SumUp..." : "Create & Pay with SumUp"}
                </button>
            </div>
        </form>
    );
}
