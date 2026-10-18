"use client";

/**
 * Payments List Page
 *
 * Admin portal page for viewing and managing all payments.
 * Themed to match Go Kids Play admin portal (light mode).
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard, Search, RefreshCw, CheckCircle, XCircle,
    Clock, TrendingUp, ArrowUpRight, ArrowDownRight,
    ChevronUp, ChevronDown, Filter, Eye, Zap,
    ShieldCheck, AlertCircle, FileText
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

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
    created_at: string;
    customer_name: string;
    customer_email: string;
    booking_number: string;
    booking_date: string;
}

type SortKey = "id" | "amount" | "created_at" | "status";
type SortDir = "asc" | "desc";

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string; icon: React.ReactNode }> = {
    SUCCESS:         { label: "Success",  cls: "text-emerald-700 bg-emerald-100 border-emerald-200", dot: "bg-emerald-500", icon: <CheckCircle className="w-3.5 h-3.5" /> },
    FAILED:          { label: "Failed",   cls: "text-red-700 bg-red-100 border-red-200",            dot: "bg-red-500",     icon: <XCircle className="w-3.5 h-3.5" />     },
    CREATED:         { label: "Pending",  cls: "text-amber-700 bg-amber-100 border-amber-200",       dot: "bg-amber-500",   icon: <Clock className="w-3.5 h-3.5" />       },
    PENDING:         { label: "Pending",  cls: "text-amber-700 bg-amber-100 border-amber-200",       dot: "bg-amber-500",   icon: <Clock className="w-3.5 h-3.5" />       },
    PENDING_PAYMENT: { label: "Pending",  cls: "text-amber-700 bg-amber-100 border-amber-200",       dot: "bg-amber-500",   icon: <Clock className="w-3.5 h-3.5" />       },
    REFUNDED:        { label: "Refunded", cls: "text-purple-700 bg-purple-100 border-purple-200",    dot: "bg-purple-500",  icon: <ArrowDownRight className="w-3.5 h-3.5" />},
};

const PROVIDER_CONFIG: Record<string, { label: string; cls: string }> = {
    SUMUP:    { label: "SumUp",    cls: "text-blue-700 bg-blue-100 border-blue-200" },
    VENUE:    { label: "At venue", cls: "text-emerald-700 bg-emerald-100 border-emerald-200" },
    MOCK:     { label: "Mock",     cls: "text-sky-700 bg-sky-100 border-sky-200"         },
    RAZORPAY: { label: "Razorpay", cls: "text-violet-700 bg-violet-100 border-violet-200"},
    STRIPE:   { label: "Stripe",   cls: "text-indigo-700 bg-indigo-100 border-indigo-200"},
};

function StatCard({ label, value, sub, color, icon }: {
    label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-xl border p-5 bg-white shadow-sm flex flex-col gap-3 ${color}`}
        >
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 shadow-sm">{icon}</div>
            </div>
            <div>
                <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
                {sub && <p className="text-xs mt-1 text-slate-500">{sub}</p>}
            </div>
        </motion.div>
    );
}

function SortBtn({ col, sort, dir }: { col: SortKey; sort: SortKey; dir: SortDir }) {
    const active = sort === col;
    return (
        <span className="flex items-center gap-1 group select-none">
            {active ? (
                dir === "asc"
                    ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                    : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
            ) : (
                <ChevronUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity text-slate-400" />
            )}
        </span>
    );
}

export default function PaymentsListPage({ initialSearch = "" }: { initialSearch?: string }) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterProvider, setFilterProvider] = useState("all");
    const [sort, setSort] = useState<SortKey>("created_at");
    const [dir, setDir] = useState<SortDir>("desc");

    useEffect(() => { fetchPayments(); }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            // Silently verify any stale pending payments before fetching
            await fetch('/api/payments/auto-verify', { method: 'POST', cache: 'no-store' }).catch(() => {});

            // Use the admin proxy route — forwards admin_token cookie automatically
            const response = await fetch(`/api/payments/list?limit=2000`, { 
                credentials: "include", 
                cache: "no-store" 
            });
            if (response.ok) {
                const data = await response.json();
                // Normalize: coerce amount to a real number immediately so future
                // calculations (reduce, toLocaleString) always work correctly.
                const raw: any[] = data.results || data;
                const normalized = raw.map((p: any) => ({
                    ...p,
                    amount: parseFloat(p.amount) || 0,
                }));
                setPayments(normalized);
            } else {
                console.error("Failed to fetch payments:", response.status);
            }
        } catch (error) {
            console.error("Failed to fetch payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReverify = async (orderId: string) => {
        if (!confirm(`Are you sure you want to verify status with SumUp for order ${orderId}?`)) return;
        
        try {
            setLoading(true);
            // Use the admin proxy route
            const response = await fetch(`/api/payments/reverify/${orderId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (response.ok) {
                await fetchPayments();
            } else {
                const err = await response.json();
                alert(`Re-verify failed: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Re-verify error:", error);
            alert("Error trying to re-verify payment.");
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => ({
        total:      payments.length,
        success:    payments.filter(p => p.status === "SUCCESS").length,
        failed:     payments.filter(p => p.status === "FAILED").length,
        pending:    payments.filter(p => p.status === "CREATED" || p.status === "PENDING" || p.status === "PENDING_PAYMENT").length,
        refunded:   payments.filter(p => p.status === "REFUNDED").length,
        revenue:    payments.filter(p => p.status === "SUCCESS" && Number(p.amount) > 0).reduce((s, p) => s + Number(p.amount), 0),
    }), [payments]);

    const toggleSort = (key: SortKey) => {
        if (sort === key) setDir(d => d === "asc" ? "desc" : "asc");
        else { setSort(key); setDir("desc"); }
    };

    const filtered = useMemo(() => {
        let list = [...payments];

        if (searchTerm) {
            const q = searchTerm.trim().toLowerCase();
            // Booking numbers can be typed loosely: "gk 482-913", "#GK482913"
            const ref = q.replace(/[\s#-]/g, "");
            list = list.filter(p =>
                (ref && (p.booking_number || "").toLowerCase().replace(/[\s#-]/g, "").includes(ref)) ||
                p.order_id.toLowerCase().includes(q) ||
                (p.payment_id?.toLowerCase() ?? "").includes(q) ||
                (p.customer_name?.toLowerCase() ?? "").includes(q) ||
                (p.customer_email?.toLowerCase() ?? "").includes(q) ||
                p.id.toString().includes(q)
            );
        }
        if (filterStatus !== "all") {
            list = list.filter(p => p.status === filterStatus);
        }
        if (filterProvider !== "all") list = list.filter(p => p.provider === filterProvider);

        list.sort((a, b) => {
            let av: number | string = 0, bv: number | string = 0;
            if (sort === "id")         { av = a.id;          bv = b.id; }
            if (sort === "amount")     { av = Number(a.amount); bv = Number(b.amount); }
            if (sort === "created_at") { av = a.created_at;  bv = b.created_at; }
            if (sort === "status")     { av = a.status;       bv = b.status; }
            if (av < bv) return dir === "asc" ? -1 : 1;
            if (av > bv) return dir === "asc" ? 1 : -1;
            return 0;
        });

        return list;
    }, [payments, searchTerm, filterStatus, filterProvider, sort, dir]);

    const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
    const fmtTime = (d: string) => new Date(d).toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit",
    });

    const StatusBadge = ({ status }: { status: string }) => {
        const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["CREATED"];
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${cfg.cls}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
            </span>
        );
    };

    return (
        <div className="p-8 space-y-6">

            {/* ── Header ── */}
            <PageHeader
                title="Payments"
                description={`${stats.total} transactions total`}
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin" },
                    { label: "Payments" },
                ]}
                actions={
                    <button
                        onClick={fetchPayments}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-300 shadow-sm hover:bg-slate-50 text-slate-700 transition-all text-sm font-semibold disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                }
            />

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    label="Total"
                    value={stats.total}
                    color="border-slate-200"
                    icon={<FileText className="w-5 h-5 text-slate-500" />}
                />
                <StatCard
                    label="Revenue"
                    value={`£${stats.revenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    sub={`${stats.success} successful`}
                    color="border-emerald-200 ring-1 ring-emerald-50"
                    icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                />
                <StatCard
                    label="Success"
                    value={stats.success}
                    sub={stats.total ? `${Math.round((stats.success / stats.total) * 100)}% rate` : "—"}
                    color="border-slate-200"
                    icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
                />
                <StatCard
                    label="Pending"
                    value={stats.pending}
                    color="border-slate-200"
                    icon={<Clock className="w-5 h-5 text-amber-500" />}
                />
                <StatCard
                    label="Failed"
                    value={stats.failed}
                    color="border-slate-200"
                    icon={<AlertCircle className="w-5 h-5 text-red-500" />}
                />
            </div>

            {/* ── Filters ── */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by booking number (GK…/GP…), name, email or order ID…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400 transition-all text-sm"
                    />
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    {/* Status filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="pl-9 pr-8 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm appearance-none cursor-pointer transition-all min-w-[140px]"
                        >
                            <option value="all">All Status</option>
                            <option value="SUCCESS">Success</option>
                            <option value="CREATED">Pending</option>
                            <option value="FAILED">Failed</option>
                            <option value="REFUNDED">Refunded</option>
                        </select>
                    </div>

                    {/* Provider filter */}
                    <div className="relative">
                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                            value={filterProvider}
                            onChange={e => setFilterProvider(e.target.value)}
                            className="pl-9 pr-8 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm appearance-none cursor-pointer transition-all min-w-[150px]"
                        >
                            <option value="all">All Providers</option>
                            <option value="SUMUP">SumUp (online)</option>
                            <option value="VENUE">Paid at venue</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                {/* Table head */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 border-b-2 border-slate-200">
                            <tr>
                                {[
                                    { label: "#ID",      key: "id"         as SortKey, w: "w-16" },
                                    { label: "Customer", key: null,                    w: "min-w-[180px]" },
                                    { label: "Booking",  key: null,                    w: "w-32" },
                                    { label: "Provider", key: null,                    w: "w-28" },
                                    { label: "Amount",   key: "amount"     as SortKey, w: "w-28" },
                                    { label: "Status",   key: "status"     as SortKey, w: "w-28" },
                                    { label: "Date",     key: "created_at" as SortKey, w: "w-36" },
                                    { label: "",         key: null,                    w: "w-20" },
                                ].map(({ label, key, w }) => (
                                    <th key={label} className={`px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider ${w}`}>
                                        {key ? (
                                            <button onClick={() => toggleSort(key)} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                                                {label}
                                                <SortBtn col={key} sort={sort} dir={dir} />
                                            </button>
                                        ) : label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {/* Loading skeleton */}
                            {loading && Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <td key={j} className="px-6 py-4">
                                            <div className="h-4 rounded-md bg-slate-100 animate-pulse" style={{ width: `${[40, 120, 70, 60, 50, 60, 80, 50][j]}px` }} />
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* Empty state */}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium">No payments found</p>
                                        <p className="text-slate-400 text-xs mt-1">Try adjusting your filters</p>
                                    </td>
                                </tr>
                            )}

                            {/* Rows */}
                            <AnimatePresence>
                                {!loading && filtered.map((payment, i) => {
                                    const statusCfg = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG["CREATED"];
                                    const providerCfg = PROVIDER_CONFIG[payment.provider] ?? { label: payment.provider, cls: "text-slate-700 bg-slate-100 border-slate-200" };
                                    const isNegative = payment.amount < 0;

                                    return (
                                        <motion.tr
                                            key={payment.id}
                                            initial={{ opacity: 0, x: -6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="hover:bg-blue-50/30 transition-colors group"
                                        >
                                            {/* ID */}
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-slate-500 font-medium">#{payment.id}</span>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                                                        {(payment.customer_name || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-slate-900 font-semibold text-sm truncate">{payment.customer_name || "—"}</p>
                                                        <p className="text-slate-500 text-xs truncate">{payment.customer_email || ""}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Booking */}
                                            <td className="px-6 py-4">
                                                {payment.booking_id ? (
                                                    <Link href={`/admin/bookings/${payment.booking_id}`}
                                                        className="text-blue-600 hover:text-blue-700 font-mono text-xs font-bold hover:underline transition-colors bg-blue-50 px-2 py-1 rounded">
                                                        {payment.booking_number || `#${payment.booking_id}`}
                                                    </Link>
                                                ) : payment.party_booking_id ? (
                                                    <Link href={`/admin/party-bookings/${payment.party_booking_id}`}
                                                        className="text-purple-600 hover:text-purple-700 font-mono text-xs font-bold hover:underline transition-colors bg-purple-50 px-2 py-1 rounded">
                                                        {payment.booking_number || `P#${payment.party_booking_id}`}
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">—</span>
                                                )}
                                            </td>

                                            {/* Provider */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${providerCfg.cls}`}>
                                                    {providerCfg.label}
                                                </span>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    {isNegative
                                                        ? <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                                                        : <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                                                    }
                                                    <span className={`font-bold text-sm ${isNegative ? "text-red-600" : "text-slate-900"}`}>
                                                        {isNegative ? "-" : ""}£{Math.abs(payment.amount).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <StatusBadge status={payment.status} />
                                            </td>

                                            {/* Date */}
                                            <td className="px-6 py-4">
                                                <p className="text-slate-700 text-sm font-medium">{fmt(payment.created_at)}</p>
                                                <p className="text-slate-500 text-xs">{fmtTime(payment.created_at)}</p>
                                            </td>

                                            {/* Action */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {(payment.status === "CREATED" || payment.status === "PENDING" || payment.status === "PENDING_PAYMENT") && payment.provider?.toLowerCase() === "sumup" && (
                                                        <button
                                                            onClick={() => handleReverify(payment.order_id)}
                                                            disabled={loading}
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg border border-amber-200 transition-all"
                                                        >
                                                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                                                            Re-verify
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/admin/payments/${payment.id}`}
                                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </Link>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {!loading && filtered.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of{" "}
                            <span className="font-semibold text-slate-900">{payments.length}</span> payments
                        </p>
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 text-xs font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Transactions secured</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
