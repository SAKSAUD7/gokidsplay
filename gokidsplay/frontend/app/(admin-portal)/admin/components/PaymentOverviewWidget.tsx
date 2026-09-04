"use client";

/**
 * Payment Overview Widget
 * 
 * Displays payment statistics and recent payments on the admin dashboard
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, TrendingUp, DollarSign, CheckCircle, XCircle, ArrowRight, RefreshCw } from "lucide-react";

interface PaymentStats {
    total_payments: number;
    successful_payments: number;
    failed_payments: number;
    total_refunds: number;
    total_revenue: number;
    today_revenue: number;
    this_week_revenue: number;
    this_month_revenue: number;
    avg_transaction_value: number;
    success_rate: number;
    payment_methods: {
        MOCK: number;
        RAZORPAY: number;
    };
    recent_payments: Array<{
        id: number;
        order_id: string;
        amount: number;
        status: string;
        provider: string;
        created_at: string;
        booking: {
            id: number;
            type: string;
            name: string;
            email: string;
            date: string | null;
        } | null;
    }>;
    daily_revenue: Array<{
        date: string;
        revenue: number;
    }>;
}

export function PaymentOverviewWidget() {
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Use the Next.js proxy route so the httpOnly admin_token cookie
            // is read server-side and forwarded as an Authorization header to Django.
            const response = await fetch(`/api/payments/stats`, {
                credentials: "include",
                cache: "no-store",
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch payment stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 border border-emerald-200">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return "text-green-600 bg-green-100 border-green-300";
            case "FAILED":
                return "text-red-600 bg-red-100 border-red-300";
            default:
                return "text-gray-600 bg-gray-100 border-gray-300";
        }
    };

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 border border-emerald-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="text-emerald-600" size={28} />
                    💳 Payment Overview
                </h2>
                <Link
                    href="/admin/payments"
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                    View All Payments <ArrowRight size={16} />
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-emerald-100 rounded-lg">
                            <DollarSign size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-slate-900">£{stats.total_revenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600">
                        {stats.total_payments} total transactions
                    </p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-blue-100 rounded-lg">
                            <TrendingUp size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Today's Revenue</p>
                            <h3 className="text-2xl font-bold text-slate-900">£{stats.today_revenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600">
                        This week: £{stats.this_week_revenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-green-100 rounded-lg">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Success Rate</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.success_rate}%</h3>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600">
                        {stats.successful_payments} successful payments
                    </p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-purple-100 rounded-lg">
                            <CreditCard size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Avg Transaction</p>
                            <h3 className="text-2xl font-bold text-slate-900">£{Math.round(stats.avg_transaction_value).toLocaleString('en-GB')}</h3>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600">
                        {stats.failed_payments} failed • {stats.total_refunds} refunds
                    </p>
                </div>
            </div>

            {/* Recent Payments Table */}
            {stats.recent_payments.length > 0 && (
                <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-sm font-bold text-slate-900">Recent Payments</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Order ID</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Customer</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Type</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.recent_payments.slice(0, 5).map((payment) => (
                                    <tr key={payment.id} className="hover:bg-emerald-50/50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-mono text-slate-700">
                                            {payment.order_id.substring(0, 20)}...
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900">
                                            {payment.booking?.name || "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${payment.booking?.type === 'party'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {payment.booking?.type || "-"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold">
                                            <span className={payment.amount < 0 ? "text-red-600" : "text-green-600"}>
                                                {payment.amount < 0 ? "-" : ""}£{Math.abs(payment.amount).toLocaleString('en-GB')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(payment.status)}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {new Date(payment.created_at).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
