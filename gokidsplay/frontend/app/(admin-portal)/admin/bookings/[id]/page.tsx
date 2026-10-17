"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, X, Printer, Mail, Users, Loader2, CreditCard } from "lucide-react";
import { PaymentHistoryCard } from "../../components/PaymentHistoryCard";
import { toast } from "sonner";

export default function BookingDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadBookingData();
    }, [params.id]);

    async function loadBookingData() {
        try {
            const bookingResponse = await fetch(`/api/bookings/${params.id}`, {
                credentials: 'include',
                cache: 'no-store',
            });

            if (bookingResponse.ok) {
                const bookingData = await bookingResponse.json();
                setBooking(bookingData);
            } else {
                toast.error('Failed to load booking details.');
            }
        } catch (error) {
            console.error('Error loading booking:', error);
            toast.error('Could not connect to server.');
        } finally {
            setLoading(false);
        }
    }

    const handlePrint = () => {
        window.print();
    };

    const handleUpdateStatus = async (updates: any) => {
        setActionLoading(true);
        try {
            const response = await fetch(`/api/bookings/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(updates),
            });
            if (response.ok) {
                const data = await response.json();
                setBooking(data);
                toast.success(`Booking updated successfully!`);
            } else {
                const err = await response.json().catch(() => ({}));
                console.error('Update failed:', err);
                toast.error(err.error || 'Failed to update booking. Please try again.');
            }
        } catch (error) {
            console.error('Error updating:', error);
            toast.error('Failed to update booking. Check your connection.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResendEmail = async () => {
        setActionLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';
            const response = await fetch(`${API_URL}/emails/send-booking-confirmation/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ booking_id: params.id }),
            });
            if (response.ok) {
                toast.success('Confirmation email resent successfully!');
            } else {
                toast.error('Failed to resend email. Please try again.');
            }
        } catch (error) {
            toast.error('Could not connect to email service.');
        } finally {
            setActionLoading(false);
        }
    };


    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!booking) {
        return <div className="p-8">Booking not found</div>;
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <Link href="/admin/bookings" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Back to Bookings
            </Link>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Booking <span className="font-mono">{booking.booking_number || `#${booking.id}`}</span></h1>
                    <p className="text-slate-500 mt-1">Created on {new Date(booking.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Printer size={18} /> Print
                    </button>
                    <button
                        onClick={handleResendEmail}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />} Resend Email
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
                                <p className="text-slate-900 font-medium">{booking.name}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Email</label>
                                <p className="text-slate-900 font-medium">{booking.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Phone</label>
                                <p className="text-slate-900 font-medium">{booking.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Reservation Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Reservation Details</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Date</label>
                                <p className="text-slate-900 font-medium">{booking.date}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Time Slot</label>
                                <p className="text-slate-900 font-medium">{booking.time} ({booking.duration || 60} mins)</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Total Amount</label>
                                <p className="text-xl font-bold text-green-600">£{booking.amount}</p>
                            </div>
                            {booking.activity && (
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-semibold">Activity</label>
                                    <p className="text-slate-900 font-medium capitalize">
                                        {booking.activity === 'soft-play' && '🎪 Soft Play'}
                                        {booking.activity === 'laser-arena' && '🔫 Laser Arena'}
                                        {booking.activity === 'go-kart' && '🏎️ Go Karts'}
                                        {booking.activity === 'inflatable-park' && '🏰 Inflatable Park'}
                                        {/* Legacy Go Kids Play fallback */}
                                        {booking.activity === 'roller-skating' && '🛼 Roller Skating (Legacy)'}
                                        {booking.activity === 'ten-pin-bowling' && '🎳 Ten Pin Bowling (Legacy)'}
                                        {booking.activity === 'arcade' && '🕹️ Arcade (Legacy)'}
                                        {!['soft-play','laser-arena','go-kart','inflatable-park','roller-skating','ten-pin-bowling','arcade'].includes(booking.activity) && booking.activity}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment History & Gateway Updates */}
                    <PaymentHistoryCard bookingId={booking.id} bookingType="session" />

                    {booking.add_ons && booking.add_ons.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">➕ Add-ons &amp; Extras</h2>
                            <div className="space-y-3">
                                {booking.add_ons.map((ao: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{ao.emoji}</span>
                                            <div>
                                                <p className="font-semibold text-slate-900">{ao.label}</p>
                                                <p className="text-sm text-slate-500">{ao.qty} × £{Number(ao.price_each).toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-slate-900">£{Number(ao.subtotal).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-2">
                                    <span className="font-bold text-slate-700">Add-ons Total</span>
                                    <span className="font-bold text-green-600">
                                        £{booking.add_ons.reduce((s: number, ao: any) => s + Number(ao.subtotal), 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Parking plates */}
                    {booking.parking_plates && booking.parking_plates.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                🚗 Pre-booked Parking
                            </h2>
                            <p className="text-sm text-slate-500 mb-4">
                                {booking.parking_plates.length} car{booking.parking_plates.length > 1 ? 's' : ''} registered at booking time
                            </p>
                            <div className="space-y-2">
                                {booking.parking_plates.map((plate: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                        <div className="w-7 h-7 rounded bg-yellow-400 flex items-center justify-center flex-shrink-0">
                                            <span className="text-black font-black text-xs">{i + 1}</span>
                                        </div>
                                        <span className="font-mono font-bold text-slate-900 text-lg tracking-widest uppercase">{plate}</span>
                                        <span className="ml-auto text-xs text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">Pre-booked</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-3">ℹ️ Allow these vehicles entry to the secure car park on arrival.</p>
                        </div>
                    )}

                    {/* Guest Summary - Always show from booking data */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Users size={20} />
                            Guest Summary
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-3xl font-bold text-blue-600">{booking.adults || 0}</p>
                                <p className="text-sm text-slate-600 font-medium mt-1">Adults</p>
                            </div>
                            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-3xl font-bold text-amber-600">{booking.kids || 0}</p>
                                <p className="text-sm text-slate-600 font-medium mt-1">Kids</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-3xl font-bold text-slate-600">{booking.spectators || 0}</p>
                                <p className="text-sm text-slate-600 font-medium mt-1">Spectators</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-700">
                                <span className="font-bold">Total Guests:</span> {(booking.adults || 0) + (booking.kids || 0) + (booking.spectators || 0)} people
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
                            {booking.booking_status !== 'CONFIRMED' && (
                                <button
                                    onClick={() => handleUpdateStatus({ booking_status: 'CONFIRMED' })}
                                    disabled={actionLoading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                    Approve Booking
                                </button>
                            )}
                            
                            {(booking.payment_status === 'PENDING' || !booking.payment_status) && (
                                <button
                                    onClick={() => handleUpdateStatus({ payment_status: 'PAID', booking_status: 'CONFIRMED' })}
                                    disabled={actionLoading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                                    Mark as Paid (Cash)
                                </button>
                            )}

                            {booking.booking_status !== 'CANCELLED' && (
                                <button
                                    onClick={() => handleUpdateStatus({ booking_status: 'CANCELLED' })}
                                    disabled={actionLoading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                                    Cancel Booking
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
