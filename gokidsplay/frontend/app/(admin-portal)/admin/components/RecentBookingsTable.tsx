"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { AdminBookingModal } from "@/components/admin/AdminBookingModal";
import { updateBookingStatus, updatePartyBookingStatus } from "@/app/actions/admin";

export function RecentBookingsTable({ bookings }: { bookings: any[] }) {
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    const handleStatusUpdate = async (id: string, newStatus: string, isPayment: boolean) => {
        const booking = selectedBooking;
        if (!booking) return;
        const isParty = booking.type === "PARTY";
        if (isParty) {
            await updatePartyBookingStatus(id, newStatus);
        } else {
            await updateBookingStatus(id, newStatus);
        }
        // Update local state optimistically
        setSelectedBooking((prev: any) => prev ? {
            ...prev,
            booking_status: !isPayment ? newStatus : prev.booking_status,
            payment_status: isPayment ? newStatus : prev.payment_status,
            paymentStatus: isPayment ? newStatus : prev.paymentStatus,
        } : null);
    };

    return (
        <>
            {selectedBooking && (
                <AdminBookingModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onUpdateStatus={handleStatusUpdate}
                />
            )}

            {/* Recent Bookings Table */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                    <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
                    <Link href="/admin/all-bookings" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors hover:gap-2">
                        View All Bookings <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Date &amp; Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bookings.length > 0 ? (
                                bookings.map((booking: any) => (
                                    <tr key={booking.id} className="hover:bg-blue-50/50 transition-all duration-200 group border-b border-slate-100 last:border-b-0">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                    {(booking.name || 'U').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{booking.name}</p>
                                                    <p className="text-xs text-slate-500">{booking.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${booking.type === 'PARTY'
                                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                }`}>
                                                {booking.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Clock size={14} className="text-slate-400" />
                                                {booking.date} • {booking.time}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                            £{booking.amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={(booking.booking_status || booking.status) === 'CANCELLED' ? 'CANCELLED' : (booking.payment_status === 'PENDING' || booking.paymentStatus === 'PENDING' ? 'PENDING' : (booking.booking_status || booking.status))} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedBooking({ ...booking, type: booking.type || (booking.package_name ? 'PARTY' : 'SESSION') })}
                                                className="text-slate-400 hover:text-blue-600 transition-all duration-200 inline-block hover:translate-x-1 p-1 rounded"
                                                title="Quick View"
                                            >
                                                <ArrowRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No recent bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-300",
        PENDING: "bg-amber-100 text-amber-700 border-amber-300",
        CANCELLED: "bg-red-100 text-red-700 border-red-300",
        COMPLETED: "bg-blue-100 text-blue-700 border-blue-300",
    };
    const dotColors: Record<string, string> = {
        CONFIRMED: "bg-emerald-500",
        PENDING: "bg-amber-500",
        CANCELLED: "bg-red-500",
        COMPLETED: "bg-blue-500",
    };
    const labels: Record<string, string> = {
        PENDING: "Payment Pending",
        CONFIRMED: "Confirmed",
        CANCELLED: "Cancelled",
        COMPLETED: "Completed",
    };
    const defaultStyle = "bg-slate-100 text-slate-700 border-slate-300";
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${styles[status] || defaultStyle} inline-flex items-center gap-1.5`}>
            <span className={`w-2 h-2 rounded-full ${dotColors[status] || 'bg-slate-400'}`} />
            {labels[status] || status}
        </span>
    );
}
