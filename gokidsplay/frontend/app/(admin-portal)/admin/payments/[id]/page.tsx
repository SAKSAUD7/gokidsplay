"use client";

/**
 * Payment Detail Page
 * 
 * View payment details and process refunds
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, CheckCircle, XCircle, Clock, DollarSign, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Payment {
    id: number;
    booking_id: number | null;
    party_booking_id: number | null;
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

export default function PaymentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const paymentId = params.id as string;

    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [refundAmount, setRefundAmount] = useState("");
    const [refundReason, setRefundReason] = useState("");
    const [isRefunding, setIsRefunding] = useState(false);
    const [refundError, setRefundError] = useState("");

    useEffect(() => {
        fetchPaymentDetails();
    }, [paymentId]);

    const fetchPaymentDetails = async () => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
            const response = await fetch(`${API_URL}/payments/${paymentId}/`, {
                credentials: "include",
                cache: "no-store",
            });

            if (response.ok) {
                const data = await response.json();
                setPayment(data);
                setRefundAmount(Math.abs(data.amount).toString());
            }
        } catch (error) {
            console.error("Failed to fetch payment details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!payment || !refundAmount) return;

        setIsRefunding(true);
        setRefundError("");

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
            const response = await fetch(`${API_URL}/payments/refund/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    payment_id: payment.id,
                    amount: parseFloat(refundAmount),
                    reason: refundReason,
                }),
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return <CheckCircle className="w-6 h-6 text-green-400" />;
            case "FAILED":
                return <XCircle className="w-6 h-6 text-red-400" />;
            case "CREATED":
                return <Clock className="w-6 h-6 text-blue-400" />;
            case "REFUNDED":
                return <DollarSign className="w-6 h-6 text-orange-400" />;
            default:
                return <Clock className="w-6 h-6 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return "text-green-400 bg-green-400/10 border-green-400/30";
            case "FAILED":
                return "text-red-400 bg-red-400/10 border-red-400/30";
            case "CREATED":
                return "text-blue-400 bg-blue-400/10 border-blue-400/30";
            case "REFUNDED":
                return "text-orange-400 bg-orange-400/10 border-orange-400/30";
            default:
                return "text-gray-400 bg-gray-400/10 border-gray-400/30";
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-96">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Payment Not Found</h2>
                    <Link href="/admin/payments" className="text-primary hover:text-primary/80">
                        Back to Payments
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/payments"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-white" />
                </Link>
                <div>
                    <h1 className="text-3xl font-display font-black text-white flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-primary" />
                        Payment #{payment.id}
                    </h1>
                    <p className="text-white/60 mt-1">View payment details and process refunds</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payment Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Card */}
                    <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Payment Status</h2>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(payment.status)}`}>
                                {getStatusIcon(payment.status)}
                                <span className="font-bold">{payment.status}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-white/60 text-sm mb-1">Amount</p>
                                <p className={`text-2xl font-black ${payment.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                                    {payment.amount < 0 ? "-" : ""}£{Math.abs(payment.amount).toLocaleString('en-GB')}
                                </p>
                            </div>
                            <div>
                                <p className="text-white/60 text-sm mb-1">Provider</p>
                                <p className="text-xl font-bold text-white">{payment.provider}</p>
                            </div>
                            <div>
                                <p className="text-white/60 text-sm mb-1">Order ID</p>
                                <p className="text-sm font-mono text-white">{payment.order_id}</p>
                            </div>
                            <div>
                                <p className="text-white/60 text-sm mb-1">Payment ID</p>
                                <p className="text-sm font-mono text-white">{payment.payment_id || "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-xl border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-4">Booking Details</h2>
                        {payment.booking_id ? (
                            <Link
                                href={`/admin/bookings/${payment.booking_id}`}
                                className="text-primary hover:text-primary/80 font-medium text-lg"
                            >
                                Session Booking #{payment.booking_id} →
                            </Link>
                        ) : payment.party_booking_id ? (
                            <Link
                                href={`/admin/party-bookings/${payment.party_booking_id}`}
                                className="text-primary hover:text-primary/80 font-medium text-lg"
                            >
                                Party Booking #{payment.party_booking_id} →
                            </Link>
                        ) : (
                            <p className="text-white/40">No booking associated</p>
                        )}
                    </div>

                    {/* Provider Response */}
                    {payment.provider_response && (
                        <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-xl border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-4">Provider Response</h2>
                            <pre className="bg-surface-900 p-4 rounded-lg text-xs text-white/80 overflow-x-auto">
                                {JSON.stringify(payment.provider_response, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Refund Section */}
                <div className="lg:col-span-1">
                    {payment.status === "SUCCESS" && payment.amount > 0 && (
                        <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-xl border border-white/10 sticky top-6">
                            <h2 className="text-xl font-bold text-white mb-4">Process Refund</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">
                                        Refund Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        max={payment.amount}
                                        step="0.01"
                                        className="w-full px-4 py-2 bg-surface-900 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                                    />
                                    <p className="text-xs text-white/40 mt-1">
                                        Max: £{payment.amount.toLocaleString('en-GB')}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">
                                        Reason (Optional)
                                    </label>
                                    <textarea
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-surface-900 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none resize-none"
                                        placeholder="Reason for refund..."
                                    />
                                </div>

                                {refundError && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                        <p className="text-red-400 text-sm">{refundError}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleRefund}
                                    disabled={isRefunding || !refundAmount || parseFloat(refundAmount) <= 0}
                                    className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isRefunding ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <DollarSign className="w-5 h-5" />
                                            Process Refund
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-white/40 text-center">
                                    ⚠️ This action cannot be undone
                                </p>
                            </div>
                        </div>
                    )}

                    {payment.amount < 0 && (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                            <DollarSign className="w-8 h-8 text-orange-400 mb-3" />
                            <h3 className="text-lg font-bold text-orange-400 mb-2">Refund Payment</h3>
                            <p className="text-white/60 text-sm">
                                This is a refund payment. Original payment has been refunded.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
