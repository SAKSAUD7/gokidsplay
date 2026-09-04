"use client";

import { useState } from "react";
import { Eye, Edit2 } from "lucide-react";
import Link from "next/link";
import BookingEditModal from "./BookingEditModal";

interface BookingsTableProps {
    bookings: any[];
}

export default function BookingsTable({ bookings }: BookingsTableProps) {
    const [editingBooking, setEditingBooking] = useState<any>(null);

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking ID</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Guests</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Waivers</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.map((booking) => (
                                <tr
                                    key={booking.id}
                                    className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                                    onClick={() => setEditingBooking(booking)}
                                >
                                    <td className="py-4 px-6 text-sm font-medium text-gray-900">
                                        #{String(booking.id).slice(-6).toUpperCase()}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="text-sm font-medium text-gray-900">{booking.name}</div>
                                        <div className="text-xs text-gray-500">{booking.email}</div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-600">
                                        <div>{new Date(booking.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-400">{booking.time}</div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-600">
                                        {booking.guests}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-900">
                                        £{booking.amount}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${booking.waivers.length >= booking.guests ? 'bg-green-100 text-green-800' :
                                                booking.waivers.length > 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'}`}>
                                            {booking.waivers.length}/{booking.guests} Signed
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => setEditingBooking(booking)}
                                                className="p-2 text-gray-400 hover:text-neon-blue hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Booking"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <Link
                                                href={`/admin/bookings/${booking.id}`}
                                                className="p-2 text-gray-400 hover:text-neon-blue hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingBooking && (
                <BookingEditModal
                    booking={editingBooking}
                    onClose={() => setEditingBooking(null)}
                />
            )}
        </>
    );
}
