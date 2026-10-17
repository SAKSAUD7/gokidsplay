"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, X, Printer, Mail, Users, User, CheckCircle, FileSignature } from "lucide-react";

export default function SessionBookingDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadBookingData() {
            try {
                // Fetch session booking details via API route
                const bookingResponse = await fetch(`/api/bookings/${params.id}?type=SESSION`, {
                    credentials: 'include',
                    cache: 'no-store',
                });

                if (bookingResponse.ok) {
                    const bookingData = await bookingResponse.json();
                    setBooking(bookingData);
                }
            } catch (error) {
                console.error('Error loading session booking:', error);
            } finally {
                setLoading(false);
            }
        }
        loadBookingData();
    }, [params.id]);

    const handlePrint = () => {
        window.print();
    };

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            const response = await fetch(`/api/bookings/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ type: 'SESSION', booking_status: newStatus }),
                cache: 'no-store',
            });
            if (response.ok) {
                // Reload booking data
                const data = await response.json();
                setBooking(data);
            } else {
                const err = await response.text();
                console.error('Status update failed:', err);
                alert('Failed to update booking status. Please try again.');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update booking status. Please check your connection.');
        }
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!booking) {
        return <div className="p-8">Session booking not found</div>;
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <Link href="/admin/session-bookings" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Back to Session Bookings
            </Link>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Booking #{String(booking.id).padStart(6, '0')}</h1>
                    <p className="text-slate-500 mt-1">Created on {new Date(booking.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Printer size={18} /> Print
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                        <Mail size={18} /> Resend Email
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Customer Details</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Name</label>
                                <p className="text-slate-900 font-medium">{booking.customer?.name || booking.name}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Email</label>
                                <p className="text-slate-900 font-medium">{booking.customer?.email || booking.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Phone</label>
                                <p className="text-slate-900 font-medium">{booking.customer?.phone || booking.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Session Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Session Details</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Date</label>
                                <p className="text-slate-900 font-medium">{booking.date}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Time Slot</label>
                                <p className="text-slate-900 font-medium">{booking.time_slot}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Total Amount</label>
                                <p className="text-xl font-bold text-green-600">£{booking.amount}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Payment Status</label>
                                <p className="text-slate-900 font-medium">{booking.payment_status || 'PENDING'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Guest Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Users size={20} />
                            Guest Summary
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-3xl font-bold text-blue-600">{booking.kids || 0}</p>
                                <p className="text-sm text-slate-600 font-medium mt-1">Kids</p>
                            </div>
                            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-3xl font-bold text-amber-600">{booking.adults || 0}</p>
                                <p className="text-sm text-slate-600 font-medium mt-1">Adults</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-3xl font-bold text-purple-600">{booking.spectators || 0}</p>
                                <p className="text-sm text-slate-600 font-medium mt-1">Spectators</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-700">
                                <span className="font-bold">Total Guests:</span> {(booking.kids || 0) + (booking.adults || 0) + (booking.spectators || 0)} people
                            </p>
                        </div>
                    </div>

                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Status</h2>
                        <div className="mb-6">
                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold 
                ${booking.booking_status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                    booking.booking_status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                                        'bg-red-100 text-red-700'}`}>
                                {booking.booking_status || 'PENDING'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleUpdateStatus('CONFIRMED')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                <Check size={18} /> Confirm Booking
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('CANCELLED')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
                            >
                                <X size={18} /> Cancel Booking
                            </button>
                        </div>
                    </div>

                    {/* Arrival Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Arrival Status</h2>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${booking.has_arrived
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                            {booking.has_arrived ? (
                                <>
                                    <CheckCircle size={16} />
                                    Arrived
                                </>
                            ) : (
                                'Not Arrived'
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
