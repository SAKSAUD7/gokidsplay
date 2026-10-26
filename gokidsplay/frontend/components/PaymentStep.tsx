"use client";

/**
 * Payment Step Component — SumUp Integration (Live)
 * Styled to match the old Go Kids Play website booking payment layout.
 *
 * Flow:
 *   1. Shows detailed booking breakdown table (left) + payment box (right)
 *   2. "Pay Now" → backend creates a SumUp checkout (the server decides the amount)
 *   3. SumUp's card form opens right here (SumUp Card Widget); when SumUp says the payment
 *      went through, the customer goes straight to /book/success, which confirms it with
 *      SumUp on the server and shows the ticket
 *   4. If the card form can't load, the customer is sent to SumUp's own payment page instead
 *      (it has a "back to Go Kids Play" button); the test gateway always uses its own page
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    Loader2, AlertCircle, Shield, Lock, CreditCard, ChevronLeft
} from "lucide-react";

interface BookingDetails {
    ticketLines?: Array<{ label: string; qty: number; subtotal: number }>; // admission tickets by type
    timeLabel?: string; // ready-made session time text (e.g. "Any 2 hours, 10.30am – 6pm")
    duration?: string | number; // session length in minutes
    date: string;
    time: string;
    name: string;
    email: string;
    phone?: string;
    activity?: string | null;
    adults?: number;
    kids?: number;
    spectators?: number;
    adultPrice?: number;
    kidPrice?: number;
    spectatorPrice?: number;
    parkingQty?: number;
    parkingPrice?: number;
    discount?: number;
    appliedVoucher?: string | null;
    onlineBookingFee?: number;
    notes?: string;
    [key: string]: any;
}

interface PaymentStepProps {
    bookingId: string | number;
    bookingType: "session" | "party";
    amount: number; // in pence (e.g. 1995 = £19.95)
    bookingDetails: BookingDetails;
    onSuccess: () => void;
    onBack: () => void;
}

// All Go Kids Play activities are paid to the same merchant account
const MERCHANT_LABELS: Record<string, string> = {};

const ACTIVITY_LABELS: Record<string, string> = {
    "all-access":      "All-Access Play Session",
    "soft-play":       "Mega Soft Play",
    "laser-arena":     "Laser Arena",
    "go-karts":        "Go Karts",
    "inflatable-park": "Inflatable Park",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

// SumUp Card Widget (https://developer.sumup.com/online-payments/checkouts/card-widget)
const SUMUP_SDK = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
declare global {
    interface Window { SumUpCard?: { mount: (config: Record<string, unknown>) => { unmount?: () => void } } }
}

function loadSumUpSdk(): Promise<void> {
    if (typeof window !== "undefined" && window.SumUpCard) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${SUMUP_SDK}"]`);
        const script = existing || document.createElement("script");
        const timer = window.setTimeout(() => reject(new Error("timeout")), 12000);
        script.addEventListener("load", () => { window.clearTimeout(timer); if (window.SumUpCard) resolve(); else reject(new Error("no SDK")); });
        script.addEventListener("error", () => { window.clearTimeout(timer); reject(new Error("blocked")); });
        if (!existing) { script.src = SUMUP_SDK; script.async = true; document.body.appendChild(script); }
    });
}

function fmt(amount: number) {
    return `£${amount.toFixed(2)}`;
}

function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleDateString("en-GB", {
            weekday: "short", day: "numeric", month: "short", year: "numeric"
        });
    } catch { return dateStr; }
}

function formatTime(time: string, durationMins: number = 60) {
    if (!time) return "—";
    const [h, m] = time.split(":").map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + durationMins;
    const fmtTime = (mins: number) => {
        const hh = Math.floor(mins / 60) % 24;
        const mm = mins % 60;
        const ampm = hh >= 12 ? "pm" : "am";
        const hh12 = hh % 12 || 12;
        return `${hh12}:${mm.toString().padStart(2, "0")} ${ampm}`;
    };
    return `${fmtTime(startMins)} - ${fmtTime(endMins)}`;
}

// A single row in the breakdown table
function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
    return (
        <tr className={`border-b border-gray-100 ${bold ? "font-bold" : ""}`}>
            <td className="py-2.5 px-4 text-gray-700 text-sm w-1/2">{label}</td>
            <td className={`py-2.5 px-4 text-sm w-1/2 ${accent ? "text-primary font-bold" : bold ? "text-gray-900 font-bold" : "text-gray-800"}`}>
                {value}
            </td>
        </tr>
    );
}

export function PaymentStep({
    bookingId,
    bookingType,
    amount,
    bookingDetails,
    onSuccess,
    onBack,
}: PaymentStepProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);
    // The SumUp checkout being paid in the card form on this page
    const [checkout, setCheckout] = useState<{ orderId: string; checkoutUrl: string } | null>(null);
    const [cardStatus, setCardStatus] = useState<"loading" | "ready" | "processing">("loading");
    const widgetRef = useRef<{ unmount?: () => void } | null>(null);

    const d = bookingDetails;
    const activity  = d.activity || "";
    const merchant  = MERCHANT_LABELS[activity] || "Go Kids Go Coventry Ltd";   // the name on the SumUp account and card statements
    const actLabel  = ACTIVITY_LABELS[activity] || (bookingType === "party" ? "Party" : "Session");

    // Quantities & prices
    const adults       = d.adults       ?? 1;
    const kids         = d.kids         ?? 0;
    const spectators   = d.spectators   ?? 0;
    const adultPrice   = d.adultPrice   ?? 9.95;
    const kidPrice     = d.kidPrice     ?? 9.95;
    const specPrice    = d.spectatorPrice ?? 2.95;
    const parkingQty   = d.parkingQty    ?? 0;
    const parkingPrice = d.parkingPrice  ?? 3.00;
    const discount     = d.discount      ?? 0;
    const onlineFee    = d.onlineBookingFee ?? 2.00;
    const notes        = d.notes || "N/a";

    // Derived totals
    // Go Kids Play sessions are flat per-person prices — no duration multiplier
    // (must match the booking wizard total and the server-side price)
    const ticketsAdults    = adults * adultPrice;
    const ticketsKids      = kids   * kidPrice;
    const ticketsSpecs     = spectators * specPrice;
    
    // Admission tickets by type (all-access session) take precedence over the legacy headcount pricing
    const ticketLines      = d.ticketLines && d.ticketLines.length > 0 ? d.ticketLines : null;
    const totalTickets     = ticketLines
        ? ticketLines.reduce((sum, line) => sum + line.subtotal, 0)
        : ticketsAdults + ticketsKids + ticketsSpecs;
    
    // For party bookings, recalculate based on base package
    const partyBasePrice   = d.partyBasePrice ?? 250.00;
    const partyExtraKids   = d.partyExtraKids ?? Math.max(0, kids - 10);
    // Party wizard passes accompanying adults as `adults`
    const partyExtraSpecs  = d.partyExtraSpectators ?? Math.max(0, (bookingType === "party" ? adults : spectators) - 10);
    const partyExtraKidsCost = partyExtraKids * (d.partyExtraKidPrice ?? 20.00);
    const partyExtraSpecsCost = partyExtraSpecs * (d.partyExtraSpectatorPrice ?? 4.95);
    
    const parkingTotal     = parkingQty * parkingPrice;
    const addOnsTotal      = parkingTotal;
    
    const subtotal         = bookingType === "party" 
                                ? (partyBasePrice + partyExtraKidsCost + partyExtraSpecsCost + addOnsTotal) 
                                : (totalTickets + addOnsTotal);
                                
    const afterDiscount    = Math.max(0, subtotal - discount);
    const grandTotal       = afterDiscount + onlineFee;
    const amountGBP        = (amount / 100).toFixed(2);

    const handlePayNow = async () => {
        setLoading(true);
        setError(null);
        try {
            // (The party payment type — deposit or full — is stored when the booking is created.)
            // Use internal /api/payments/create-order proxy to avoid mixed-content (HTTPS→HTTP) errors
            const res = await fetch(`/api/payments/create-order`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    booking_id:   bookingId,
                    booking_type: bookingType,
                    amount:       parseFloat(amountGBP),
                }),
                cache: "no-store",
            });
            const data = await res.json();
            if (!res.ok || !data.checkout_url) {
                throw new Error(data.error || "Failed to create payment. Please try again.");
            }
            if (data.mock || String(data.provider || "").toLowerCase() !== "sumup" || !data.order_id) {
                window.location.href = data.checkout_url;      // test gateway: its own page
                return;
            }
            setCardStatus("loading");
            setCheckout({ orderId: data.order_id, checkoutUrl: data.checkout_url });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    // Show SumUp's card form once there is a checkout to pay
    useEffect(() => {
        if (!checkout) return;
        let cancelled = false;
        loadSumUpSdk().then(() => {
            if (cancelled || !window.SumUpCard) return;
            widgetRef.current = window.SumUpCard.mount({
                id: "sumup-card",
                checkoutId: checkout.orderId,
                locale: "en-GB",
                email: bookingDetails.email || undefined,
                onLoad: () => setCardStatus("ready"),
                onResponse: (type: string, body: any) => {
                    if (type === "sent" || type === "auth-screen") setCardStatus("processing");
                    if (type === "success") {
                        setCardStatus("processing");
                        // The success page confirms the payment with SumUp on the server before showing PAID
                        window.location.href = `/book/success?checkout_id=${encodeURIComponent(checkout.orderId)}&booking_type=${bookingType}`;
                    }
                    if (type === "fail" || type === "error") {
                        widgetRef.current?.unmount?.();
                        widgetRef.current = null;
                        setCheckout(null);
                        setLoading(false);
                        const message = typeof body === "object" && body ? (body.message || body.error_message) : "";
                        setError(type === "fail"
                            ? "The payment didn't go through. No money was taken - please check your card details or try another card."
                            : `The payment couldn't be completed${message ? `: ${message}` : ""}. Please try again.`);
                    }
                },
            });
            setCardStatus("ready");
        }).catch(() => {
            // Card form couldn't load (e.g. blocked script): use SumUp's own payment page instead
            if (!cancelled) window.location.href = checkout.checkoutUrl;
        });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkout]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <span className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-bold uppercase tracking-wider mb-3">
                    Step 7
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-2">
                    Booking Payment
                </h2>
                <p className="text-white/60">Review your booking and complete payment securely via SumUp.</p>
            </div>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* ── LEFT: Booking Breakdown Table ─────────────────────── */}
                <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-800 text-white">
                                <th className="py-3 px-4 text-left text-sm font-bold uppercase tracking-wide w-1/2">Info</th>
                                <th className="py-3 px-4 text-left text-sm font-bold uppercase tracking-wide w-1/2">You&apos;ve Chosen</th>
                            </tr>
                        </thead>
                        <tbody>
                            <Row label="Session Date"    value={formatDate(d.date)} />
                            <Row label="Session Time"    value={d.timeLabel || formatTime(d.time, Number(d.duration) || 60)} />
                            <Row label="Activity"        value={actLabel} />

                            {bookingType === "party" ? (
                                <>
                                    {/* For parties: kids = participants, adults = spectators (accompanying adults) */}
                                    <Row label="Party Participants (kids)" value={`${kids} (up to 10 included)`} />
                                    {adults > 0 && <Row label="Accompanying adults" value={`${adults} (up to 10 included)`} />}
                                    
                                    <Row label="Party Base Package Price" value={fmt(partyBasePrice)} />
                                    {partyExtraKids > 0 && <Row label={`Extra Kids Price (${partyExtraKids} × ${fmt(d.partyExtraKidPrice ?? 20.00)})`} value={fmt(partyExtraKidsCost)} />}
                                    {partyExtraSpecs > 0 && <Row label={`Extra Spectators Price (${partyExtraSpecs} × ${fmt(d.partyExtraSpectatorPrice ?? 4.95)})`} value={fmt(partyExtraSpecsCost)} />}
                                </>
                            ) : (
                                <>
                                    {ticketLines ? (
                                        ticketLines.map((line) => (
                                            <Row key={line.label} label={`${line.label} × ${line.qty}`} value={fmt(line.subtotal)} />
                                        ))
                                    ) : (
                                        <>
                                            <Row label="Visitors" value={String(adults + kids)} />
                                            {spectators > 0 && (
                                                <Row label="Non-playing adults" value={String(spectators)} />
                                            )}
                                        </>
                                    )}

                                    {/* Add-ons */}
                                    {parkingQty > 0 && <Row label="Parking Spaces"     value={String(parkingQty)} />}

                                    {/* Pricing breakdown */}
                                    {!ticketLines && <Row label="Visitor Tickets" value={fmt(ticketsAdults + ticketsKids)} />}
                                    {!ticketLines && spectators > 0 && <Row label="Non-playing adult tickets" value={fmt(ticketsSpecs)} />}
                                    {parkingQty > 0 && <Row label="Total Parking Price"    value={fmt(parkingTotal)} />}
                                </>
                            )}

                            <Row
                                label="Paying Full Amount?"
                                value={amount >= Math.round(grandTotal * 100) ? "Yes" : `No — paying ${fmt(amount / 100)} now`}
                            />

                            <Row
                                label="Subtotal"
                                value={fmt(afterDiscount)}
                                bold
                            />

                            {discount > 0 && (
                                <Row
                                    label={`Discount Applied${d.appliedVoucher ? ` (${d.appliedVoucher})` : ""}`}
                                    value={`-${fmt(discount)}`}
                                    accent
                                />
                            )}
                            {discount === 0 && (
                                <Row label="Discount Applied" value="No" accent />
                            )}

                            <Row label="Pay For Parking?" value={parkingQty > 0 ? fmt(parkingTotal) : "£0"} />

                            <Row label="Notes" value={notes} />

                            {onlineFee > 0 && (
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <td className="py-2.5 px-4 text-sm text-gray-600">
                                    Online Booking Charge
                                    <br />
                                    <span className="text-xs text-gray-400">(Tickets can be purchased at centre, cash only)</span>
                                </td>
                                <td className="py-2.5 px-4 text-sm text-gray-800 font-medium">{fmt(onlineFee)}</td>
                            </tr>
                            )}

                            {/* Grand total */}
                            <tr className="bg-gray-900 text-white">
                                <td className="py-4 px-4 text-base font-black uppercase tracking-wide">Overall Total Amount</td>
                                <td className="py-4 px-4 text-2xl font-black text-yellow-400">{fmt(grandTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ── RIGHT: Payment Box ────────────────────────────────── */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-4">

                    {/* Card logos + Pay panel */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        {/* Card brand logos */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-[#1A1F71] text-white text-xs font-black px-2 py-1 rounded">VISA</span>
                            <span className="bg-gradient-to-r from-red-500 to-yellow-500 text-white text-xs font-black px-2 py-1 rounded">MC</span>
                            <span className="bg-[#016FD0] text-white text-xs font-black px-2 py-1 rounded">AMEX</span>
                        </div>

                        <h3 className="text-gray-900 font-black text-lg mb-1">Pay with Credit/Debit Card</h3>
                        <p className="text-gray-500 text-xs mb-5">
                            Card payments are handled securely by <strong>SumUp</strong>.
                            Your card details never reach our servers.
                        </p>

                        {/* Booking Ref */}
                        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
                            <span className="text-gray-500 text-xs font-medium">Booking Ref</span>
                            <span className="text-gray-800 font-mono font-bold text-sm">{bookingDetails.booking_number || `#${bookingId}`}</span>
                        </div>

                        {/* Merchant */}
                        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 flex justify-between items-center">
                            <span className="text-gray-500 text-xs font-medium">Payable to</span>
                            <span className="text-gray-800 font-bold text-sm">{merchant}</span>
                        </div>

                        {/* Amount */}
                        <div className="text-center mb-5">
                            <p className="text-gray-500 text-xs mb-1">Total Amount Due</p>
                            <p className="text-4xl font-black text-gray-900">£{amountGBP}</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-600 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        {/* SumUp card form (after Pay Now) */}
                        {checkout && (
                            <div className="mb-2">
                                {cardStatus === "loading" && (
                                    <p className="flex items-center justify-center gap-2 text-gray-500 text-sm py-6">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading secure card form…
                                    </p>
                                )}
                                {cardStatus === "processing" && (
                                    <p className="flex items-center justify-center gap-2 text-gray-700 text-sm font-semibold pb-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Processing your payment… please don&apos;t close this page
                                    </p>
                                )}
                                <div id="sumup-card" className="text-gray-900" />
                                <a href={checkout.checkoutUrl} className="block text-center text-xs text-gray-500 underline mt-2">
                                    Having trouble? Pay on SumUp&apos;s page instead
                                </a>
                            </div>
                        )}

                        {/* Pay button */}
                        {!checkout && (
                        <button
                            type="button"
                            onClick={handlePayNow}
                            disabled={loading}
                            className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-black rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Connecting to SumUp…
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Pay Now
                                </>
                            )}
                        </button>
                        )}

                        {/* SumUp branding */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <Shield className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400 text-xs">powered by</span>
                            <span className="text-gray-600 font-black text-sm tracking-tight">sumup</span>
                        </div>

                        {/* Customer Warning */}
                        <div className="mt-4 text-center">
                            <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
                                Please don&apos;t close this page while paying. Your ticket appears as soon as the payment goes through.
                            </p>
                        </div>
                    </div>

                    {/* Security notice */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                        <Lock className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-white/50 text-xs leading-relaxed">
                            256-bit SSL encrypted. Confirmation sent to{" "}
                            <span className="text-white/80">{bookingDetails.email}</span>.
                        </p>
                    </div>

                    {/* Back button */}
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 font-semibold transition-all disabled:opacity-40"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Summary
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
