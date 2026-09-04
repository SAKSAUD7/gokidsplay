"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, ChevronRight, LogOut, User, History, CreditCard, AlertCircle, RefreshCw, Ticket } from "lucide-react";
import Link from "next/link";
import { useAccount } from "@/state/account/AccountContext";
import { createPaymentOrder } from "@/app/actions/payment";
import { CustomerBookingModal } from "@/components/CustomerBookingModal";

interface Booking {
    id: number;
    booking_number: string;
    type: "SESSION" | "PARTY";
    activity: string;
    activity_emoji: string;
    package_name?: string;
    date: string;
    time: string;
    adults: number;
    kids: number;
    amount: number;
    status: string;
    booking_status: string;
    payment_status: string;
    created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
    CONFIRMED:      "bg-green-500/20 text-green-400 border-green-500/30",
    PENDING:        "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    PENDING_PAYMENT:"bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    DEPOSIT_PAID:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PARTIALLY_PAID: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    FULLY_PAID:     "bg-green-500/20 text-green-400 border-green-500/30",
    RESCHEDULED:    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    CANCELLED:      "bg-red-500/20 text-red-400 border-red-500/30",
    COMPLETED:      "bg-blue-500/20 text-blue-400 border-blue-500/30",
    EXPIRED:        "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AccountBookingsPage() {
    const { customer, token, loading: authLoading, logout } = useAccount();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedModal, setSelectedModal] = useState<{ id: string | number; type: "SESSION" | "PARTY" } | null>(null);
    const [pageConfig, setPageConfig] = useState<any>(null);

    const fetchConfig = async () => {
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
            const res = await fetch(`${API}/cms/customer-account-config/1/`);
            if (res.ok) {
                const data = await res.json();
                setPageConfig(data);
            }
        } catch (e) {
            console.error("Failed to load page config", e);
        }
    };

    const fetchBookings = async () => {
        if (authLoading || !token) return;
        setLoading(true);
        setFetchError(null);

        try {
            // Silently verify any stale pending payments before fetching bookings
            await fetch('/api/payments/auto-verify', { method: 'POST', cache: 'no-store' }).catch(() => {});
        } catch (e) {
            console.error('[Account] Auto-verify failed:', e);
        }

        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
        fetch(`${API}/bookings/customer-auth/my-bookings/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.ok ? r.json() : Promise.reject(new Error(`Server error: ${r.status}`)))
            .then(data => {
                // We keep pending bookings visible, so customers can resume payment if they actually abandoned it.
                // The auto-verify (above) guarantees that paid ones won't be stuck here.
                setBookings(data.bookings || []);
            })
            .catch((err) => {
                console.error('[Account] Failed to load bookings:', err);
                setFetchError("Could not load your bookings. Please check your connection and try again.");
                setBookings([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!authLoading && !customer) {
            router.replace("/account/login");
        }
    }, [authLoading, customer, router]);

    useEffect(() => {
        fetchConfig();
        fetchBookings();
    }, [token, authLoading]);

    if (authLoading || !customer) {
        return (
            <div className="min-h-screen bg-[#0a0118] flex items-center justify-center">
                <div className="text-center text-white/60">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    Loading...
                </div>
            </div>
        );
    }

    const upcoming = bookings.filter(b => b.date >= new Date().toISOString().slice(0, 10) && b.status !== "CANCELLED");
    const past = bookings.filter(b => b.date < new Date().toISOString().slice(0, 10) || b.status === "CANCELLED");

    const formattedDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short", year: "numeric"
    });

    return (
        <main className="min-h-screen bg-[#0a0118] py-20 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white">
                            {pageConfig?.header_title?.replace("{name}", customer.name.split(" ")[0]) || `Hi, ${customer.name.split(" ")[0]}! 👋`}
                        </h1>
                        <p className="text-white/50 text-sm mt-1">{customer.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/account/profile" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/70 rounded-xl hover:bg-white/10 transition-all text-sm font-semibold">
                            <User className="w-4 h-4" /> Profile
                        </Link>
                        <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/50 rounded-xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all text-sm font-semibold">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 text-center">
                        <div className="text-2xl sm:text-3xl font-black text-primary">{bookings.length}</div>
                        <div className="text-white/50 text-[10px] sm:text-xs mt-1">Total Bookings</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 text-center">
                        <div className="text-2xl sm:text-3xl font-black text-green-400">{upcoming.length}</div>
                        <div className="text-white/50 text-[10px] sm:text-xs mt-1">Upcoming</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 text-center">
                        <div className="text-2xl sm:text-3xl font-black text-blue-400">£{bookings.reduce((s, b) => s + b.amount, 0).toFixed(0)}</div>
                        <div className="text-white/50 text-[10px] sm:text-xs mt-1">Total Spent</div>
                    </div>
                </div>

                {/* Book Again CTA */}
                <Link href={pageConfig?.cta_link || "/book"} className="block mb-8 bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-500/30 rounded-2xl p-5 hover:from-pink-500/30 hover:to-purple-600/30 transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-white font-bold">{pageConfig?.cta_title || "Book Another Session"}</div>
                            <div className="text-white/50 text-sm">{pageConfig?.cta_subtitle || "Skating, bowling — book your next visit"}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-pink-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-white/60">Loading your bookings...</p>
                    </div>
                ) : fetchError ? (
                    <div className="text-center py-16">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-white/60 mb-6">{fetchError}</p>
                        <button onClick={fetchBookings} className="flex items-center gap-2 px-6 py-3 bg-primary/20 border border-primary/30 text-primary rounded-xl hover:bg-primary/30 transition-all font-bold mx-auto">
                            <RefreshCw className="w-4 h-4" /> Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        {upcoming.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-white font-black text-lg mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-pink-400" /> Upcoming
                                </h2>
                                <div className="space-y-3">
                                    {upcoming.map(booking => (
                                        <BookingCard
                                            key={`${booking.type}-${booking.id}`}
                                            booking={booking}
                                            formattedDate={formattedDate}
                                            onOpenModal={() => setSelectedModal({ id: booking.id, type: booking.type })}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {past.length > 0 && (
                            <div>
                                <h2 className="text-white/60 font-bold text-lg mb-4 flex items-center gap-2">
                                    <History className="w-5 h-5" /> Past Bookings
                                </h2>
                                <div className="space-y-3 opacity-70">
                                    {past.slice(0, 10).map(booking => (
                                        <BookingCard
                                            key={`${booking.type}-${booking.id}`}
                                            booking={booking}
                                            formattedDate={formattedDate}
                                            onOpenModal={() => setSelectedModal({ id: booking.id, type: booking.type })}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {bookings.length === 0 && (
                            <div className="text-center py-20">
                                <div className="text-5xl mb-4">🎳</div>
                                <p className="text-white/50 text-lg font-bold">{pageConfig?.empty_state_title || "No bookings yet"}</p>
                                <p className="text-white/30 text-sm mt-2 mb-8">{pageConfig?.empty_state_subtitle || "Book your first session at Go Kids Play!"}</p>
                                <Link href={pageConfig?.cta_link || "/book"} className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-full hover:scale-105 transition-all inline-block">
                                    {pageConfig?.empty_state_button_text || "Book Now"}
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Booking Detail Modal */}
            {selectedModal && (
                <CustomerBookingModal
                    bookingId={selectedModal.id}
                    bookingType={selectedModal.type}
                    onClose={() => setSelectedModal(null)}
                />
            )}
        </main>
    );
}


function BookingCard({
    booking,
    formattedDate,
    onOpenModal
}: {
    booking: Booking;
    formattedDate: (d: string) => string;
    onOpenModal: () => void;
}) {
    const statusStyle = STATUS_STYLES[booking.status] || "bg-white/10 text-white/60 border-white/10";
    const [paying, setPaying] = useState(false);

    const handleCompletePayment = async () => {
        if (paying) return;
        setPaying(true);
        try {
            const result = await createPaymentOrder({
                booking_id: booking.id,
                booking_type: booking.type === "SESSION" ? "session" : "party",
                amount: booking.amount,
            });
            if (result.success && result.checkout_url) {
                window.location.href = result.checkout_url;
            } else {
                alert(result.error || "Could not initiate payment. Please try again.");
            }
        } catch (e) {
            alert("Payment error. Please try again.");
        } finally {
            setPaying(false);
        }
    };

    const isPendingPayment = booking.payment_status === "PENDING";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-2xl p-5 transition-all ${isPendingPayment ? "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50" : "bg-white/5 border-white/10 hover:border-white/20"}`}
        >
            <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{booking.activity_emoji}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-bold">{booking.package_name || booking.activity}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${isPendingPayment ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : statusStyle}`}>
                            {isPendingPayment ? "Payment Pending"
                            : booking.status === "DEPOSIT_PAID" ? "Deposit Paid"
                            : booking.status === "PARTIALLY_PAID" ? "Partially Paid"
                            : booking.status === "FULLY_PAID" ? "Fully Paid"
                            : booking.status === "RESCHEDULED" ? "Rescheduled"
                            : booking.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-white/50 text-sm flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formattedDate(booking.date)}</span>
                        {booking.time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{booking.time}</span>}
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{(booking.adults || 0) + (booking.kids || 0)} guests</span>
                    </div>
                    {booking.booking_number && (
                        <p className="text-white/30 text-xs mt-1">#{booking.booking_number}</p>
                    )}
                    {/* PENDING payment CTA */}
                    {isPendingPayment && (
                        <div className="mt-3">
                            <button
                                onClick={handleCompletePayment}
                                disabled={paying}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-xs rounded-xl hover:from-yellow-400 hover:to-orange-400 transition-all disabled:opacity-60 shadow-md"
                            >
                                <CreditCard className="w-3.5 h-3.5" />
                                {paying ? "Processing..." : "Complete Payment"}
                            </button>
                            <p className="text-yellow-500/60 text-[10px] mt-1">Payment required to confirm your booking</p>
                        </div>
                    )}
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="text-white font-black">£{booking.amount.toFixed(2)}</div>
                    {/* View button — show for all statuses that have actionable detail */}
                    {!['EXPIRED', 'CANCELLED'].includes(booking.status) && (
                        <button
                            onClick={onOpenModal}
                            className={`text-xs flex items-center gap-0.5 mt-1 ml-auto font-bold transition-colors ${booking.type === "PARTY" ? "text-pink-400 hover:text-pink-300" : "text-primary hover:text-primary/80"}`}
                        >
                            {booking.type === "PARTY" ? "Manage Party" : "View Details"}
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    )}
                    {/* Party balance due banner */}
                    {booking.type === "PARTY" && booking.status === "DEPOSIT_PAID" && (
                        <p className="text-blue-400/70 text-[10px] mt-1 text-right">Balance due</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
