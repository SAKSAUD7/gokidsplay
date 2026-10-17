"use client";

/**
 * Payment Detail Page
 *
 * One payment with the booking it belongs to (by booking number), the customer,
 * the SumUp references, and refunds.
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CreditCard, CheckCircle, XCircle, Clock, PoundSterling, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Payment {
    id: number;
    booking_id: number | null;
    party_booking_id: number | null;
    booking_number: string | null;
    booking_date: string | null;
    customer_name: string | null;
    customer_email: string | null;
    provider: string;
    order_id: string;
    payment_id: string | null;
    amount: number;
    currency: string;
    status: string;
    provider_response: any;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

const STATUS_STYLE: Record<string, { cls: string; icon: JSX.Element }> = {
    SUCCESS: { cls: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle className="w-5 h-5" /> },
    FAILED: { cls: "text-red-700 bg-red-50 border-red-200", icon: <XCircle className="w-5 h-5" /> },
    CREATED: { cls: "text-blue-700 bg-blue-50 border-blue-200", icon: <Clock className="w-5 h-5" /> },
    REFUNDED: { cls: "text-orange-700 bg-orange-50 border-orange-200", icon: <PoundSterling className="w-5 h-5" /> },
};

const money = (n: number) => `${n < 0 ? "-" : ""}£${Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function PaymentDetailPage() {
    const params = useParams();
    const paymentId = params.id as string;

    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [refundAmount, setRefundAmount] = useState("");
    const [refundReason, setRefundReason] = useState("");
    const [isRefunding, setIsRefunding] = useState(false);
    const [refundError, setRefundError] = useState("");

    const fetchPaymentDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/payments/${paymentId}`, { cache: "no-store" });
            if (response.ok) {
                const data = await response.json();
                const amount = parseFloat(data.amount) || 0;
                setPayment({ ...data, amount });
                setRefundAmount(Math.abs(amount).toFixed(2));
            } else {
                setPayment(null);
            }
        } catch (error) {
            console.error("Failed to fetch payment details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPaymentDetails(); }, [paymentId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRefund = async () => {
        if (!payment || !refundAmount) return;
        if (!confirm(`Refund ${money(parseFloat(refundAmount))} for ${payment.booking_number || `payment #${payment.id}`}? This cannot be undone.`)) return;
        setIsRefunding(true);
        setRefundError("");
        try {
            const response = await fetch(`/api/payments/refund`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment_id: payment.id, amount: parseFloat(refundAmount), reason: refundReason }),
            });
            const result = await response.json();
            if (result.success) {
                alert("Refund processed successfully!");
                fetchPaymentDetails();
            } else {
                setRefundError(result.error || "Refund failed");
            }
        } catch (error: any) {
            setRefundError(error.message || "Failed to process refund");
        } finally {
            setIsRefunding(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-96">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="p-8 text-center py-16">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Payment not found</h2>
                <Link href="/admin/payments" className="text-blue-600 hover:underline">Back to Payments</Link>
            </div>
        );
    }

    const style = STATUS_STYLE[payment.status] || { cls: "text-slate-700 bg-slate-50 border-slate-200", icon: <Clock className="w-5 h-5" /> };
    const bookingHref = payment.booking_id
        ? `/admin/bookings/${payment.booking_id}`
        : payment.party_booking_id ? `/admin/party-bookings/${payment.party_booking_id}` : null;
    const reference = payment.provider_response?.checkout_reference;

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/payments" className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowLeft className="w-5 h-5" /></Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <CreditCard className="w-7 h-7 text-blue-600" />
                        Payment {payment.booking_number ? `for ${payment.booking_number}` : `#${payment.id}`}
                    </h1>
                    <p className="text-slate-500 mt-1">Taken {when(payment.created_at)} · payment #{payment.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900">Payment</h2>
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold ${style.cls}`}>
                                {style.icon}{payment.status}
                            </span>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div>
                                <dt className="text-slate-500 mb-1">Amount</dt>
                                <dd className={`text-2xl font-black ${payment.amount < 0 ? "text-red-600" : "text-emerald-700"}`}>{money(payment.amount)}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500 mb-1">Provider</dt>
                                <dd className="text-lg font-bold text-slate-900">{payment.provider}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500 mb-1">Checkout ID</dt>
                                <dd className="font-mono text-slate-800 break-all">{payment.order_id}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500 mb-1">Transaction ID</dt>
                                <dd className="font-mono text-slate-800 break-all">{payment.payment_id || "—"}</dd>
                            </div>
                            {reference && (
                                <div className="col-span-2">
                                    <dt className="text-slate-500 mb-1">SumUp reference</dt>
                                    <dd className="font-mono text-slate-800">{reference}</dd>
                                </div>
                            )}
                            {payment.notes && (
                                <div className="col-span-2">
                                    <dt className="text-slate-500 mb-1">Notes</dt>
                                    <dd className="text-slate-800 whitespace-pre-line">{payment.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Booking</h2>
                        {bookingHref ? (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="font-mono text-xl font-black text-slate-900">{payment.booking_number}</p>
                                    <p className="text-sm text-slate-500">
                                        {payment.booking_id ? "Play session" : "Party"}
                                        {payment.booking_date && <> · {new Date(payment.booking_date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</>}
                                    </p>
                                    {payment.customer_name && <p className="text-sm text-slate-700 mt-1">{payment.customer_name} · {payment.customer_email}</p>}
                                </div>
                                <Link href={bookingHref} className="text-sm font-semibold text-blue-700 border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 hover:bg-blue-100">
                                    Open booking →
                                </Link>
                            </div>
                        ) : (
                            <p className="text-slate-400">No booking linked to this payment</p>
                        )}
                    </div>

                    {payment.provider_response && (
                        <details className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <summary className="text-lg font-bold text-slate-900 cursor-pointer">Provider response</summary>
                            <pre className="mt-4 bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs text-slate-700 overflow-x-auto">
                                {JSON.stringify(payment.provider_response, null, 2)}
                            </pre>
                        </details>
                    )}
                </div>

                <div className="lg:col-span-1">
                    {payment.status === "SUCCESS" && payment.amount > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Refund</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Refund amount (£)</label>
                                    <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
                                        max={payment.amount} step="0.01" min="0.01"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <p className="text-xs text-slate-400 mt-1">Up to {money(payment.amount)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason (optional)</label>
                                    <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={3}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        placeholder="Reason for refund…" />
                                </div>
                                {refundError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{refundError}</p>}
                                <button onClick={handleRefund}
                                    disabled={isRefunding || !refundAmount || parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > payment.amount}
                                    className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isRefunding ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</> : <><PoundSterling className="w-4 h-4" /> Refund</>}
                                </button>
                                <p className="text-xs text-slate-400 text-center">The money goes back to the customer&apos;s card through SumUp.</p>
                            </div>
                        </div>
                    )}

                    {payment.amount < 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                            <PoundSterling className="w-7 h-7 text-orange-600 mb-3" />
                            <h3 className="text-lg font-bold text-orange-800 mb-1">Refund</h3>
                            <p className="text-sm text-orange-900/80">This entry is a refund of an earlier payment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
