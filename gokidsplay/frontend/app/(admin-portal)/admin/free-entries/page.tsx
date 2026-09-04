"use client";

import { useState, useEffect } from "react";
import { getFreeEntries } from "@/app/actions/cms";
import { Mail, Phone, Calendar, CheckCircle, XCircle, Clock, Plus, Ticket, FileText } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/admin/Button";

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
    return (
        <div className={`relative overflow-hidden rounded-xl border p-5 bg-white shadow-sm flex flex-col gap-3 ${color}`}>
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                <div className={`p-2 rounded-lg ${color.replace('border-', 'bg-').replace('300', '50')} ${color.replace('border-', 'text-').replace('300', '600')}`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            </div>
        </div>
    );
}

export default function FreeEntriesPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadEntries();
    }, []);

    async function loadEntries() {
        try {
            const data = await getFreeEntries();
            setEntries(data);
        } catch (error) {
            console.error("Error loading entries:", error);
        } finally {
            setLoading(false);
        }
    }

    const stats = {
        total: entries.length,
        pending: entries.filter(e => e.status === "PENDING").length,
        approved: entries.filter(e => e.status === "APPROVED").length,
        rejected: entries.filter(e => e.status === "REJECTED").length
    };

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Free Entries"
                description={`${loading ? "Loading..." : `${stats.total} total submissions`}`}
                icon={<Ticket className="w-8 h-8" />}
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin" },
                    { label: "Free Entries" }
                ]}
                actions={
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        icon={<Plus size={16} />}
                    >
                        Create New Entry
                    </Button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Requests"
                    value={stats.total}
                    color="border-slate-200"
                    icon={<FileText className="w-5 h-5 text-slate-500" />}
                />
                <StatCard
                    label="Pending"
                    value={stats.pending}
                    color="border-amber-300"
                    icon={<Clock className="w-5 h-5 text-amber-500" />}
                />
                <StatCard
                    label="Approved"
                    value={stats.approved}
                    color="border-emerald-300"
                    icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
                />
                <StatCard
                    label="Rejected"
                    value={stats.rejected}
                    color="border-red-300"
                    icon={<XCircle className="w-5 h-5 text-red-500" />}
                />
            </div>

            {/* Entries Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-100 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Applicant</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 rounded-md bg-slate-100 animate-pulse" style={{ width: `${[120, 200, 70, 80, 50][j]}px` }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium text-lg">No free entry requests found</p>
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry, i) => (
                                    <tr 
                                        key={entry.id} 
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                                                        {(entry.name || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm text-slate-900 truncate">{entry.name}</p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                                                            <Mail size={12} />
                                                            {entry.email}
                                                        </p>
                                                        {entry.phone && (
                                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                                                <Phone size={12} />
                                                                {entry.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-700 max-w-md line-clamp-2">{entry.reason}</p>
                                                {entry.notes && (
                                                    <p className="text-xs text-slate-500 mt-1 italic">Note: {entry.notes}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {entry.status === "PENDING" && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200 text-amber-700 bg-amber-50">
                                                        <Clock className="w-3.5 h-3.5" /> Pending
                                                    </span>
                                                )}
                                                {entry.status === "APPROVED" && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200 text-emerald-700 bg-emerald-50">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                                                    </span>
                                                )}
                                                {entry.status === "REJECTED" && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200 text-red-700 bg-red-50">
                                                        <XCircle className="w-3.5 h-3.5" /> Rejected
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {new Date(entry.created_at || entry.createdAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <FreeEntryActions entry={entry} />
                                                </div>
                                            </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreateModal && (
                <CreateFreeEntryModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadEntries();
                    }}
                />
            )}
        </div>
    );
}
