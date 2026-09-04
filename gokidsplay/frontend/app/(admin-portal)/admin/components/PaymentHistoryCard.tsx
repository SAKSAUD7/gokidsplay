"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PaymentHistoryCardProps {
    bookingId: number;
    bookingType: 'session' | 'party';
}

export function PaymentHistoryCard({ bookingId, bookingType }: PaymentHistoryCardProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            // Adjust to your actual backend URL pattern. It seems to be served under /api/payments/...
            const res = await fetch(`/api/payments/booking/${bookingId}/${bookingType}/status/`, {
                credentials: 'include',
                cache: 'no-store'
            });
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error("Failed to load payment history:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (bookingId && bookingType) {
            loadData();
        }
    }, [bookingId, bookingType]);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-center items-center h-48 animate-pulse">
                <div className="flex flex-col items-center gap-3 opacity-50">
                    <CreditCard className="w-8 h-8 text-slate-400" />
                    <p className="text-sm text-slate-500 font-medium">Loading gateway history...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'SUCCESS' || status === 'PAID') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
        if (status === 'FAILED' || status === 'REJECTED') return <XCircle className="w-4 h-4 text-red-500" />;
        if (status === 'REFUNDED') return <AlertCircle className="w-4 h-4 text-purple-500" />;
        return <Clock className="w-4 h-4 text-amber-500" />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Payment Gateway History
                </h2>
                <button 
                    onClick={() => { setRefreshing(true); loadData(); }}
                    disabled={refreshing}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Refresh payment status"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Gateway Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1 uppercase">Total</p>
                    <p className="text-lg font-bold text-slate-900">£{data.total_amount?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1 uppercase">Paid</p>
                    <p className="text-lg font-bold text-emerald-600">£{data.paid_amount?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1 uppercase">Balance</p>
                    <p className="text-lg font-bold text-amber-600">£{data.remaining_balance?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1 uppercase">Status</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <StatusIcon status={data.payment_status} />
                        <span className="text-sm font-bold text-slate-700">{data.payment_status}</span>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Gateway Logs</h3>
                
                {data.payments?.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-sm text-slate-500">No payment attempts recorded.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                        <AnimatePresence>
                            {data.payments?.map((payment: any, idx: number) => (
                                <motion.div 
                                    key={payment.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-4 bg-white hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-full shrink-0 ${
                                            payment.status === 'SUCCESS' ? 'bg-emerald-100' :
                                            payment.status === 'FAILED' ? 'bg-red-100' : 'bg-amber-100'
                                        }`}>
                                            <StatusIcon status={payment.status} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-sm font-bold text-slate-900">£{payment.amount}</span>
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                                                    {payment.provider}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-mono break-all max-w-[200px] sm:max-w-xs truncate" title={payment.order_id}>
                                                {payment.order_id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-row md:flex-col justify-between items-end gap-1">
                                        <span className={`text-xs font-bold uppercase ${
                                            payment.status === 'SUCCESS' ? 'text-emerald-600' :
                                            payment.status === 'FAILED' ? 'text-red-600' : 'text-amber-600'
                                        }`}>
                                            {payment.status}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(payment.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
