"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Clock, Users, Activity, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ParticipantCollection from "@/components/ParticipantCollection";
import { useAccount } from "@/state/account/AccountContext";
import { createPaymentOrder } from "@/app/actions/payment";

export function CustomerBookingModal({
    bookingId,
    bookingType,
    onClose,
}: {
    bookingId: string | number;
    bookingType: "SESSION" | "PARTY";
    onClose: () => void;
}) {
    const { token } = useAccount();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    // Edit mode state for pending bookings

    // Cancellation state
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelSuccess, setCancelSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setError("Authentication required. Please log in.");
            return;
        }
        const fetchDetails = async () => {
            try {
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
                // Use customer-auth endpoint — supports CustomerToken (not staff JWT)
                const type = bookingType === "PARTY" ? "party" : "session";
                const endpoint = `/bookings/customer-auth/booking/${type}/${bookingId}/`;
                    
                const res = await fetch(`${API}${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (!res.ok) {
                    if (res.status === 401) throw new Error("Session expired. Please log in again.");
                    if (res.status === 404) throw new Error("Booking not found.");
                    throw new Error(`Could not load booking details (${res.status})`);
                }
                const data = await res.json();
                setBooking(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [bookingId, bookingType, token]);

    const handleParticipantSubmit = async (data: { adults: any[]; minors: any[]; waiverSigned: boolean }) => {
        setSaving(true);
        setSaveSuccess(false);
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
            const res = await fetch(`${API}/bookings/customer-auth/booking/party/${bookingId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ participants: { adults: data.adults, minors: data.minors } }),
            });
            if (!res.ok) throw new Error("Failed to save the guest list");
            setBooking(await res.json());
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 5000);
        } catch (error: any) {
            alert(error.message || "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!token) return;
        setCancelling(true);
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
            const type = bookingType === "PARTY" ? "party" : "session";
            const endpoint = `/bookings/customer-auth/booking/${type}/${bookingId}/`;
            const res = await fetch(`${API}${endpoint}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'cancel' }),
            });
            if (!res.ok) throw new Error(`Failed to cancel booking (${res.status})`);
            const data = await res.json();
            setBooking(data);
            setShowCancelConfirm(false);
            setCancelSuccess(true);
        } catch (err: any) {
            alert(err.message || 'Could not cancel booking. Please contact us.');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                    onClick={onClose}
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-[#0f0422] border border-white/10 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col z-10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${bookingType === "PARTY" ? 'bg-pink-500/20 text-pink-400' : 'bg-primary/20 text-primary'}`}>
                                {bookingType === "PARTY" ? <Users size={24} /> : <Activity size={24} />}
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-white">
                                    {bookingType === "PARTY" ? 'Party Booking' : 'Session Booking'}
                                </h2>
                                <p className="text-white/50 text-sm font-medium">#{bookingId}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-white/50">
                                <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
                                <p>Loading details...</p>
                            </div>
                        ) : error || !booking ? (
                            <div className="text-center py-20 text-red-400 flex flex-col items-center">
                                <AlertCircle className="w-12 h-12 mb-4" />
                                <p className="font-bold">{error || "Booking not found"}</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Booking Summary */}
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white/80">Booking Details</h3>
                                        {/* Date, time and numbers change the price, so the team makes those changes */}
                                        <a href="/contact" className="text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                                            Need a change? Contact us
                                        </a>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-white/40 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Calendar size={12}/> Date</p>
                                            <p className="text-white font-semibold">{new Date(booking.date).toLocaleDateString("en-GB")}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Clock size={12}/> Time</p>
                                            <p className="text-white font-semibold">{booking.time || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Users size={12}/> Guests</p>
                                            <p className="text-white font-semibold">{(booking.adults || 0) + (booking.kids || 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40 text-xs font-bold uppercase mb-1">Status</p>
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${(booking.status === 'CANCELLED' || booking.booking_status === 'CANCELLED') ? 'bg-red-500/20 text-red-400 border border-red-500/30' : (booking.payment_status === 'PENDING' || booking.status === 'PENDING' || booking.booking_status === 'PENDING') ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                                {(booking.status === 'CANCELLED' || booking.booking_status === 'CANCELLED') ? 'Cancelled' : (booking.payment_status === 'PENDING' || booking.status === 'PENDING' || booking.booking_status === 'PENDING') ? 'Payment Pending' : (booking.status || booking.booking_status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Complete Payment CTA for Pending Bookings */}
                                {(booking.payment_status === 'PENDING' || booking.status === 'PENDING' || booking.booking_status === 'PENDING') && !(booking.status === 'CANCELLED' || booking.booking_status === 'CANCELLED') && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mt-6">
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-1">Complete Your Booking</h3>
                                                <p className="text-white/60 text-sm">Your booking is pending payment. Pay now to secure your slot.</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-2xl font-black text-yellow-500">£{Number(booking.amount || 0).toFixed(2)}</div>
                                                <button
                                                    onClick={async () => {
                                                        setSaving(true);
                                                        try {
                                                            const res = await createPaymentOrder({
                                                                booking_id: booking.id,
                                                                booking_type: bookingType === "PARTY" ? "party" : "session",
                                                                amount: booking.amount
                                                            });
                                                            if (res.success && res.checkout_url) {
                                                                window.location.href = res.checkout_url;
                                                            } else {
                                                                alert(res.error || "Failed to initiate payment");
                                                            }
                                                        } catch (e: any) {
                                                            alert(e.message || "An error occurred");
                                                        } finally {
                                                            setSaving(false);
                                                        }
                                                    }}
                                                    disabled={saving}
                                                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap shadow-lg shadow-yellow-500/20"
                                                >
                                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Pay Now"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Party Specific: Balance Payment */}
                                {bookingType === "PARTY" && booking.remaining_balance > 0 && (
                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mt-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Remaining Balance</h3>
                                                <p className="text-sm text-white/60">Pay your balance before the party begins.</p>
                                            </div>
                                            <div className="text-2xl font-black text-primary">
                                                £{booking.remaining_balance.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between text-sm text-white/50">
                                                <span>Total Cost</span>
                                                <span>£{(booking.amount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-white/50">
                                                <span>Amount Paid</span>
                                                <span>£{(booking.paid_amount || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                setSaving(true);
                                                try {
                                                    const res = await createPaymentOrder({
                                                        booking_id: booking.id,
                                                        booking_type: "party",
                                                        amount: booking.remaining_balance  // GBP amount, not pence
                                                    });
                                                    if (res.success && res.checkout_url) {
                                                        window.location.href = res.checkout_url;
                                                    } else {
                                                        alert(res.error || "Failed to initiate payment");
                                                    }
                                                } catch (e: any) {
                                                    alert(e.message || "An error occurred");
                                                } finally {
                                                    setSaving(false);
                                                }
                                            }}
                                            disabled={saving}
                                            className="w-full mt-4 bg-primary hover:bg-primary/90 text-black font-black py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay £${booking.remaining_balance.toFixed(2)} Now`}
                                        </button>
                                    </div>
                                )}

                                {/* Party Specific: Manage Participants */}
                                {bookingType === "PARTY" && (
                                    <div className="relative">
                                        {saveSuccess && (
                                            <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                                <span className="font-bold text-sm">Participants saved successfully!</span>
                                            </div>
                                        )}
                                        
                                        <ParticipantCollection
                                            onSubmit={handleParticipantSubmit}
                                            totalParticipants={(booking.adults || 0) + (booking.kids || 0) + (booking.spectators || 0)}
                                            title="Manage Party Guests"
                                            subtitle="Add details for all participants attending the party."
                                            initialAdults={booking.participants?.adults || []}
                                            initialMinors={booking.participants?.minors || []}
                                            initialWaiverSigned={booking.waiver_signed}
                                        />
                                        
                                        {saving && (
                                            <div className="absolute inset-0 bg-[#0f0422]/80 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10">
                                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Session Specific: Ticket Info */}
                                {bookingType === "SESSION" && booking.payment_status !== 'PENDING' && booking.status !== 'PENDING' && booking.booking_status !== 'PENDING' && (
                                    <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
                                        <div className="text-6xl mb-4 text-primary">🎟️</div>
                                        <h3 className="text-xl font-bold text-white mb-2">Digital Ticket</h3>
                                        <p className="text-white/60 text-sm mb-6 max-w-sm mx-auto">
                                            Your booking is confirmed! Show your booking ID <strong className="text-white">#{booking.booking_number}</strong> at the reception when you arrive.
                                        </p>
                                    </div>
                                )}

                                {/* Cancel Booking Section */}
                                {booking.status !== 'CANCELLED' && booking.booking_status !== 'CANCELLED' && (
                                    <div className="border border-red-500/20 rounded-2xl p-6">
                                        {cancelSuccess ? (
                                            <div className="flex items-center gap-3 text-red-400">
                                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-bold">Booking Cancelled</p>
                                                    <p className="text-sm text-white/50">Your booking has been cancelled. Contact us if you need assistance.</p>
                                                </div>
                                            </div>
                                        ) : showCancelConfirm ? (
                                            <div className="text-center">
                                                <p className="text-white font-bold mb-1">Are you sure?</p>
                                                <p className="text-white/50 text-sm mb-4">This action cannot be undone. Refunds are subject to our cancellation policy.</p>
                                                <div className="flex gap-3 justify-center">
                                                    <button
                                                        onClick={() => setShowCancelConfirm(false)}
                                                        className="px-5 py-2.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-sm"
                                                    >
                                                        Keep Booking
                                                    </button>
                                                    <button
                                                        onClick={handleCancelBooking}
                                                        disabled={cancelling}
                                                        className="px-5 py-2.5 bg-red-500/20 border border-red-500/40 text-red-400 font-bold rounded-xl hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                        {cancelling ? 'Cancelling...' : 'Yes, Cancel It'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-white/60 text-sm font-semibold">Need to cancel?</p>
                                                    <p className="text-white/30 text-xs">Subject to our cancellation policy</p>
                                                </div>
                                                <button
                                                    onClick={() => setShowCancelConfirm(true)}
                                                    className="px-4 py-2 text-red-400/70 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-all"
                                                >
                                                    Cancel Booking
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
