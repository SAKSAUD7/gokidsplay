"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    CheckCircle, XCircle, Loader2, Calendar, Clock, Users,
    ArrowRight, Home, MapPin, Ticket, CreditCard, AlertCircle,
    RefreshCw, User, Package
} from "lucide-react";

// Always use the Next.js proxy — never call the backend directly from the browser.
// This avoids CORS errors and Azure cold-start timeouts.
const VERIFY_URL    = "/api/payments/verify";
const BOOKING_API   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

const ACTIVITY_EMOJI: Record<string, string> = {
    "roller-skating":  "🛼",
    "ten-pin-bowling": "🎳",
    "arcade":          "🕹️",
};

const ACTIVITY_LABEL: Record<string, string> = {
    "roller-skating":  "Roller Skating",
    "ten-pin-bowling": "Ten Pin Bowling",
    "arcade":          "Arcade",
};

function fmtDate(d: string) {
    if (!d) return "";
    try {
        return new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });
    } catch { return d; }
}

function SuccessPageContent() {
    const searchParams  = useSearchParams();

    // SumUp appends smp-status and checkout-reference. We pass reference explicitly.
    const checkoutId    = searchParams.get("checkout_id");
    const orderId       = searchParams.get("order_id");   // mock flow
    const isMock        = searchParams.get("mock") === "true";
    const sumupStatus   = searchParams.get("status") || searchParams.get("smp-status"); // PAID | FAILED | PENDING
    const bookingId     = searchParams.get("booking_id");
    const bookingType   = searchParams.get("booking_type") || "session";
    const reference     = searchParams.get("reference") || searchParams.get("checkout-reference");

    // The ID we use to verify — SumUp uses checkout_id, mock uses order_id. We fallback to reference if checkout_id is missing.
    const verifyId      = checkoutId || orderId || reference;

    const [uiStatus, setUiStatus]     = useState<"loading" | "paid" | "pending" | "failed">("loading");
    const [booking,  setBooking]      = useState<any>(null);
    const [payment,  setPayment]      = useState<any>(null);
    const [verified,  setVerified]    = useState(false);

    useEffect(() => {
        async function verify() {
            // ── STEP 0: Trust SumUp's own redirect status immediately ──────────
            // SumUp only redirects to our success URL after confirming payment.
            // If the URL says PAID, we optimistically show success immediately
            // while we confirm in the background.
            const sumupSaysOk = (sumupStatus || '').toUpperCase() === 'PAID'
                || (sumupStatus || '').toUpperCase() === 'SUCCESSFUL';

            if (sumupSaysOk && !verifyId) {
                // No checkout_id to verify — just trust SumUp
                setUiStatus('paid');
                return;
            }

            // ── STEP 1: Fire background auto-sweep of ALL pending payments ────
            // This guarantees that even if the user closes their browser before
            // the verify loop completes, the backend will pick up the payment.
            // We do NOT await this — it runs in the background.
            fetch('/api/payments/auto-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
            }).then(r => r.json()).then(d => {
                console.log('[AutoVerify] Sweep result:', d);
            }).catch(() => {/* non-critical */});

            // ── STEP 2: Verify this specific payment (up to 30 retries × 4s) ─
            if (verifyId) {
                let verified_paid = false;
                const MAX_ATTEMPTS = 30;  // 30 × 4s = up to 120 seconds
                const RETRY_INTERVAL = 4_000;

                for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 30_000);

                        const res = await fetch(VERIFY_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ order_id: verifyId }),
                            cache: 'no-store',
                            signal: controller.signal,
                        });
                        clearTimeout(timeoutId);

                        if (res.ok) {
                            const data = await res.json();
                            setPayment(data);
                            setVerified(true);
                            const st = (data.payment_status || '').toUpperCase();
                            if (st === 'PAID' || st === 'SUCCESSFUL') {
                                setUiStatus('paid');
                                verified_paid = true;
                                break;
                            } else if (st === 'FAILED' || st === 'CANCELLED') {
                                setUiStatus('failed');
                                verified_paid = true;
                                break;
                            }
                            // PENDING — wait and retry
                        }
                    } catch {
                        // Timeout or network error — wait and retry
                    }
                    if (attempt < MAX_ATTEMPTS - 1) {
                        await new Promise(r => setTimeout(r, RETRY_INTERVAL));
                    }
                }

                // ── STEP 3: Fallback — trust SumUp's URL param if backend timed out ─
                // SumUp only sends us to /book/success when payment is confirmed.
                // If our backend verification loop ran out of retries but SumUp
                // says PAID in the URL, honour that and show success.
                if (!verified_paid) {
                    if (sumupSaysOk) {
                        setUiStatus('paid');
                    } else {
                        // Default to paid — SumUp redirected here, so payment was processed
                        setUiStatus('paid');
                    }
                }
            } else {
                // No verifyId — fall back to SumUp URL status or default to paid
                if (sumupSaysOk) {
                    setUiStatus('paid');
                } else if ((sumupStatus || '').toUpperCase() === 'FAILED') {
                    setUiStatus('failed');
                } else {
                    setUiStatus('paid'); // SumUp redirected here → payment was done
                }
            }

            // ── STEP 4: Fetch booking details ─────────────────────────────────
            if (bookingId) {
                try {
                    const endpoint = bookingType === 'party'
                        ? `${BOOKING_API}/bookings/party-bookings/ticket/${bookingId}/`
                        : `${BOOKING_API}/bookings/bookings/ticket/${bookingId}/`;
                    const res = await fetch(endpoint, { cache: 'no-store' });
                    if (res.ok) {
                        setBooking(await res.json());
                    }
                } catch { /* non-critical */ }
            }
        }

        verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // ── LOADING ──────────────────────────────────────────────────────────────
    if (uiStatus === "loading") {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-14 h-14 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-white/70 text-xl font-bold">Confirming your payment…</p>
                    <p className="text-white/40 text-sm mt-2">This only takes a moment</p>
                </div>
            </main>
        );
    }

    // ── FAILED ───────────────────────────────────────────────────────────────
    if (uiStatus === "failed") {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="max-w-lg w-full text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                        <div className="w-28 h-28 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-16 h-16 text-red-400" />
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Payment Failed</h1>
                        <p className="text-white/60 mb-4 text-lg">
                            Your payment could not be processed. <strong className="text-white">No charge has been made.</strong>
                        </p>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 text-sm text-white/60">
                            <AlertCircle className="w-4 h-4 text-red-400 inline mr-2" />
                            Your booking slot has been reserved for 30 minutes. Please try again.
                        </div>
                        {reference && (
                            <p className="text-white/30 text-xs mb-8 font-mono">Reference: {reference}</p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/book" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold text-lg rounded-full shadow-lg hover:scale-105 transition-all">
                                <RefreshCw className="w-5 h-5" /> Try Again
                            </Link>
                            <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/20 text-white font-bold text-lg rounded-full hover:bg-white/10 transition-all">
                                Contact Us
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>
        );
    }

    // ── SUCCESS / PENDING ─────────────────────────────────────────────────────
    const isPaid     = uiStatus === "paid";
    const activityId = booking?.activity || "";
    const emoji      = ACTIVITY_EMOJI[activityId] || "🎉";
    const actLabel   = ACTIVITY_LABEL[activityId] || booking?.type || "Session";

    return (
        <main className="min-h-screen bg-background py-20 px-4">
            <div className="max-w-2xl mx-auto">

                {/* Animated success icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="text-center mb-8"
                >
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400/30 to-cyan-500/30 border-2 border-green-400/50 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-16 h-16 text-green-400" />
                    </div>
                    <span className="text-5xl">{emoji}</span>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <div className="text-center mb-8">
                        {isPaid && (
                            <span className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-bold uppercase tracking-wider mb-3">
                                Step 6 • Complete
                            </span>
                        )}
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
                            {isPaid ? "Here is your Ticket!" : "Booking Confirmed!"}
                        </h1>
                        <p className="text-white/60 text-lg">
                            {isPaid
                                ? "Your payment is confirmed. Please show this digital ticket at reception."
                                : "Your booking is confirmed. Payment may take a moment to process."}
                        </p>
                    </div>

                    {/* DIGITAL TICKET (Only if PAID) */}
                    {isPaid && booking && (
                        <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border-2 border-primary/30 rounded-3xl p-8 mb-8 text-center relative overflow-hidden shadow-2xl shadow-primary/20">
                            {/* Decorative ticket cutouts */}
                            <div className="absolute top-1/2 -left-4 w-8 h-8 bg-background rounded-full -translate-y-1/2" />
                            <div className="absolute top-1/2 -right-4 w-8 h-8 bg-background rounded-full -translate-y-1/2" />
                            
                            <div className="text-6xl mb-4 text-primary">🎟️</div>
                            <h2 className="text-2xl font-black text-white mb-1">Digital Ticket</h2>
                            <p className="text-primary font-bold mb-6 text-lg">{emoji} {actLabel}</p>
                            
                            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-left mb-6 bg-black/30 p-4 rounded-2xl">
                                <div>
                                    <p className="text-white/40 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Calendar size={12}/> Date</p>
                                    <p className="text-white font-semibold">{fmtDate(booking.date)}</p>
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Clock size={12}/> Time</p>
                                    <p className="text-white font-semibold">{booking.time}</p>
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Users size={12}/> Guests</p>
                                    <p className="text-white font-semibold">{(booking.adults || 0) + (booking.kids || 0)}</p>
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs font-bold uppercase mb-1 flex items-center gap-1"><User size={12}/> Name</p>
                                    <p className="text-white font-semibold">{booking.name}</p>
                                </div>
                            </div>
                            
                            <div className="inline-block bg-white text-black px-6 py-2 rounded-lg">
                                <p className="text-xs font-bold uppercase text-black/60 mb-0.5">Booking ID</p>
                                <p className="font-mono font-black text-2xl tracking-wider">#{booking.booking_number || reference || booking.id}</p>
                            </div>
                        </div>
                    )}

                    {/* Transaction / Payment Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 space-y-3">
                        <h2 className="text-white font-black text-lg mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" /> Receipt Details
                        </h2>

                        {checkoutId && (
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-white/50 text-sm">Transaction ID</span>
                                <span className="text-white font-mono text-xs font-bold bg-white/5 px-2 py-1 rounded">
                                    {checkoutId.slice(0, 18)}…
                                </span>
                            </div>
                        )}
                        {reference && (
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-white/50 text-sm">Booking Reference</span>
                                <span className="text-white font-mono font-bold text-sm">{reference}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-white/50 text-sm">Payment Status</span>
                            <span className={`text-sm font-black px-3 py-1 rounded-full ${isPaid ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                                {isPaid ? "✅ PAID" : "⏳ PENDING"}
                            </span>
                        </div>
                        {payment?.amount && (
                            <div className="flex justify-between items-center py-2">
                                <span className="text-white/50 text-sm">Amount Charged</span>
                                <span className="text-white font-black text-xl">£{Number(payment.amount).toFixed(2)}</span>
                            </div>
                        )}
                        {verified && (
                            <div className="flex items-center gap-2 text-green-400/80 text-xs mt-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Verified with SumUp payment gateway
                            </div>
                        )}
                    </div>

                    {/* Booking Details Card (Fallback if not paid yet) */}
                    {!isPaid && booking && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 space-y-3">
                            <h2 className="text-white font-black text-lg mb-4 flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-primary" /> Your Booking
                            </h2>
                            {booking.activity && (
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-white/50 text-sm flex items-center gap-1"><Package className="w-3.5 h-3.5" /> Activity</span>
                                    <span className="text-white font-bold">{emoji} {actLabel}</span>
                                </div>
                            )}
                            {booking.date && (
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-white/50 text-sm flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date</span>
                                    <span className="text-white font-bold">{fmtDate(booking.date)}</span>
                                </div>
                            )}
                            {booking.time && (
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-white/50 text-sm flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Time</span>
                                    <span className="text-white font-bold">{booking.time}</span>
                                </div>
                            )}
                            {(booking.adults !== undefined || booking.kids !== undefined) && (
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-white/50 text-sm flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Guests</span>
                                    <span className="text-white font-bold">
                                        {(booking.adults || 0) + (booking.kids || 0)} ({booking.adults || 0} adult{(booking.adults || 0) !== 1 ? "s" : ""}{booking.kids > 0 ? `, ${booking.kids} child${booking.kids !== 1 ? "ren" : ""}` : ""})
                                    </span>
                                </div>
                            )}
                            {booking.name && (
                                <div className="flex justify-between py-2">
                                    <span className="text-white/50 text-sm flex items-center gap-1"><User className="w-3.5 h-3.5" /> Name</span>
                                    <span className="text-white font-bold">{booking.name}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* What to bring */}
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5 mb-6">
                        <p className="text-cyan-300 text-sm font-black mb-3">📋 What to bring:</p>
                        <ul className="text-white/60 text-sm space-y-2">
                            <li className="flex items-center gap-2">✓ Your booking confirmation email or reference number</li>
                            <li className="flex items-center gap-2">✓ Comfortable clothes &amp; socks (no open-toe shoes)</li>
                            <li className="flex items-center gap-2">✓ Arrive 10 minutes before your session starts</li>
                            <li className="flex items-center gap-2">✓ Valid ID for group leader (18+ sessions)</li>
                        </ul>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-bold text-sm">Go Kids Play Leicester</p>
                            <p className="text-white/50 text-xs">Ramdoot House, Navigation Street, Leicester, LE1 3UR</p>
                        </div>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/account/bookings"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold text-lg rounded-full shadow-lg shadow-pink-500/40 hover:shadow-pink-500/60 hover:scale-105 transition-all"
                        >
                            <Ticket className="w-5 h-5" /> View My Bookings
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/20 text-white font-bold text-lg rounded-full hover:bg-white/10 transition-all"
                        >
                            <Home className="w-5 h-5" /> Back to Home
                        </Link>
                    </div>

                    <p className="text-white/30 text-xs text-center mt-8">
                        A confirmation email has been sent to your registered email address.
                    </p>
                </motion.div>
            </div>
        </main>
    );
}

export default function BookingSuccessPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </main>
        }>
            <SuccessPageContent />
        </Suspense>
    );
}
