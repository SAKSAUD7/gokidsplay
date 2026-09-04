"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCachedData, setCachedData } from "@/lib/admin-cache";
import { verifyWaiver, toggleWaiverVerification, getWaivers } from "@/app/actions/admin";
import { toast } from 'sonner';
import { ArrivedToggle } from "@/components/admin/ArrivedToggle";
import {
    Search,
    Download,
    Calendar,
    FileSignature,
    Eye,
    CheckCircle,
    Clock,
    Mail,
    Phone,
    User,
    Users
} from "lucide-react";
export default function AdminWaivers() {
    const searchParams = useSearchParams();
    const bookingParam = searchParams.get("booking");
    const partyBookingParam = searchParams.get("party_booking");

    const [waivers, setWaivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [bookingTypeFilter, setBookingTypeFilter] = useState("ALL");
    const [statusTab, setStatusTab] = useState<"PENDING" | "HISTORY">("PENDING");

    useEffect(() => {
        loadWaivers();
    }, [bookingParam, partyBookingParam, statusTab]);

    async function loadWaivers() {
        setLoading(true);
        try {
            // Pass undefined for search to use default or client-side search later
            // Pass booking params for server-side filtering
            const validBookingParam = bookingParam || undefined;
            const validPartyBookingParam = partyBookingParam || undefined;
            const isVerified = statusTab === "HISTORY";

            const data = await getWaivers(undefined, validBookingParam, validPartyBookingParam, isVerified);

            if (Array.isArray(data)) {
                setWaivers(data);
                setCachedData('waivers', data);
            } else {
                console.error("Failed to load waivers: Invalid data format");
                setWaivers([]);
            }
        } catch (error) {
            console.error('Failed to load waivers:', error);
            setWaivers([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleExportCSV() {
        try {
            const isVerified = statusTab === "HISTORY";
            const response = await fetch(`/api/waivers/export?is_verified=${isVerified}`, {
                credentials: 'include',
                cache: 'no-store',
            });

            if (!response.ok) {
                toast.error('Failed to export CSV');
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `waivers_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('CSV exported successfully');
        } catch (error) {
            console.error('Failed to export CSV:', error);
            toast.error('Failed to export CSV');
        }
    }

    async function handleDownloadPDF(waiverId: string) {
        try {
            const response = await fetch(`/api/waivers/${waiverId}/pdf`, {
                credentials: 'include',
                cache: 'no-store',
            });
            const data = await response.json();
            toast.info(data.message || 'PDF download not yet implemented');
        } catch (error) {
            console.error('Failed to download PDF:', error);
            toast.error('Failed to download PDF');
        }
    }

    function handleKioskMode() {
        window.open('/kiosk/waiver', '_blank', 'fullscreen=yes');
    }

    function calculateAge(dob: string): string {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age.toString();
    }

    // No flattening needed - keep all participants grouped with primary signer
    const flattenedWaivers = useMemo(() => {
        return waivers.map((waiver: any) => ({
            ...waiver,
            isPrimary: waiver.isPrimarySigner !== undefined ? waiver.isPrimarySigner : true,
            uniqueId: waiver.id
        }));
    }, [waivers]);

    // Filter logic
    const filteredWaivers = flattenedWaivers.filter(waiver => {
        const matchesSearch =
            waiver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            waiver.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === "ALL" || waiver.participant_type === typeFilter;

        const matchesBookingType =
            bookingTypeFilter === "ALL" ||
            (bookingTypeFilter === "SESSION" && waiver.booking) ||
            (bookingTypeFilter === "PARTY" && waiver.party_booking);

        const matchesBookingId =
            (!bookingParam || String(waiver.booking) === String(bookingParam)) &&
            (!partyBookingParam || String(waiver.party_booking) === String(partyBookingParam));

        return matchesSearch && matchesType && matchesBookingType && matchesBookingId;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Waivers</h1>
                    <p className="text-slate-500 mt-1">Track and manage digital liability waivers</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
                    >
                        <Download size={16} />
                        Export All
                    </button>
                    <button
                        onClick={handleKioskMode}
                        className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-slate-900 rounded-lg hover:bg-blue-400 transition-colors font-bold text-sm"
                    >
                        <FileSignature size={16} />
                        Kiosk Mode
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-fit">
                <button
                    onClick={() => setStatusTab("PENDING")}
                    className={`flex items-center gap-2 px-6 py-2.5 font-semibold text-sm rounded-lg transition-all ${
                        statusTab === "PENDING"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                >
                    <Clock size={16} className={statusTab === "PENDING" ? "text-amber-500" : ""} />
                    Pending Waivers
                </button>
                <button
                    onClick={() => setStatusTab("HISTORY")}
                    className={`flex items-center gap-2 px-6 py-2.5 font-semibold text-sm rounded-lg transition-all ${
                        statusTab === "HISTORY"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                >
                    <CheckCircle size={16} className={statusTab === "HISTORY" ? "text-emerald-500" : ""} />
                    Arrived History
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by signer name or email..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none text-slate-900"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select
                        value={typeFilter}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm outline-none focus:border-neon-blue"
                    >
                        <option value="ALL">All Types</option>
                        <option value="ADULT">Adults Only</option>
                        <option value="MINOR">Minors Only</option>
                    </select>
                    <select
                        value={bookingTypeFilter}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBookingTypeFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm outline-none focus:border-neon-blue"
                    >
                        <option value="ALL">All Bookings</option>
                        <option value="SESSION">Session Bookings</option>
                        <option value="PARTY">Party Bookings</option>
                    </select>
                </div>
            </div>

            {/* Waivers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Participant</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Contact Info</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Signed On</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Group Details</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{statusTab === "HISTORY" ? "Status (Revert)" : "Arrival Status"}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredWaivers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileSignature size={48} className="text-slate-300" />
                                            <p className="text-lg font-medium">No waivers found</p>
                                            <p className="text-sm text-slate-400">Try adjusting your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredWaivers.map((waiver: any) => (
                                    <tr key={waiver.uniqueId || waiver.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                                        {/* 1. Participant */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-sm text-slate-700">
                                                    {(waiver.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {waiver.name || 'Unknown'}
                                                        </p>
                                                        {waiver.isPrimary && waiver.party_booking && (
                                                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                                                                Party
                                                            </span>
                                                        )}
                                                        {waiver.isPrimary && waiver.booking && (
                                                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                                                                Session
                                                            </span>
                                                        )}
                                                    </div>
                                                    {waiver.isPrimary && waiver.booking_reference && (
                                                        <p className="text-sm text-slate-500 mt-1 font-mono">
                                                            Ref: <span className="font-bold text-slate-700">{waiver.booking_reference}</span>
                                                        </p>
                                                    )}
                                                    {!waiver.isPrimary && (
                                                        <p className="text-xs text-slate-500 mt-0.5 italic font-medium">
                                                            {waiver.isAdditionalAdult ? '↳ Additional Adult in Group' : '↳ Participant'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* 2. Contact */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-1.5">
                                                {waiver.email ? (
                                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                                        <Mail size={14} className="text-blue-500 flex-shrink-0" />
                                                        <span className="truncate max-w-[200px] font-medium">{waiver.email}</span>
                                                    </div>
                                                ) : waiver.phone ? (
                                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                                        <Phone size={14} className="text-green-500 flex-shrink-0" />
                                                        <span className="font-medium">{waiver.phone}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No contact info</span>
                                                )}
                                                {waiver.dob && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md w-fit">
                                                        <span className="font-semibold">Age:</span>
                                                        <span className="font-bold text-slate-900">{calculateAge(waiver.dob)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* 3. Signed On */}
                                        <td className="px-6 py-4">
                                            {waiver.isPrimary ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                                        <Calendar size={14} className="text-blue-500" />
                                                        {new Date(waiver.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md w-fit">
                                                        <Clock size={12} className="text-slate-500" />
                                                        {new Date(waiver.signed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>

                                        {/* 4. Group Details */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2.5">
                                                {/* Adults Details */}
                                                <div className="flex flex-col gap-1.5 bg-blue-50 p-3 rounded">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-semibold text-blue-900">
                                                            {1 + (waiver.adults?.length || 0)} Adult{(1 + (waiver.adults?.length || 0)) > 1 ? 's' : ''}:
                                                        </span>
                                                    </div>
                                                    <div className="ml-1 flex flex-col gap-1.5">
                                                        {/* Primary Adult */}
                                                        <div className="text-xs bg-white px-2.5 py-1.5 rounded">
                                                            <span className="font-semibold text-blue-900">{waiver.name}</span>
                                                            {waiver.dob && (
                                                                <span className="text-slate-600 ml-2">• Age {calculateAge(waiver.dob)}</span>
                                                            )}
                                                            <span className="text-blue-600 ml-2 italic">(Primary)</span>
                                                        </div>
                                                        {/* Additional Adults */}
                                                        {waiver.adults && waiver.adults.length > 0 && waiver.adults.map((adult: any, idx: number) => (
                                                            <div key={idx} className="text-xs bg-white px-2.5 py-1.5 rounded">
                                                                <span className="font-semibold text-blue-900">{adult.name}</span>
                                                                {adult.dob && (
                                                                    <span className="text-slate-600 ml-2">• Age {calculateAge(adult.dob)}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Minors Details */}
                                                {waiver.minors && waiver.minors.length > 0 && (
                                                    <div className="flex flex-col gap-1.5 bg-purple-50 p-3 rounded">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="font-semibold text-purple-900">{waiver.minors.length} Minor{waiver.minors.length > 1 ? 's' : ''}:</span>
                                                        </div>
                                                        <div className="ml-1 flex flex-col gap-1.5">
                                                            {waiver.minors.map((minor: any, idx: number) => (
                                                                <div key={idx} className="text-xs bg-white px-2.5 py-1.5 rounded">
                                                                    <span className="font-semibold text-purple-900">{minor.name}</span>
                                                                    {minor.dob && (
                                                                        <span className="text-slate-600 ml-2">• Age {calculateAge(minor.dob)}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* 5. Arrival Status */}
                                        <td className="px-6 py-4">
                                            {waiver.isPrimary ? (
                                                <ArrivedToggle
                                                    bookingId={waiver.id}
                                                    arrived={waiver.is_verified}
                                                    onToggle={async (id, newStatus) => {
                                                        // Optimistic update
                                                        setWaivers(prev => prev.map(w => w.id === id ? { ...w, is_verified: newStatus } : w));

                                                        const res = await toggleWaiverVerification(id.toString(), newStatus);
                                                        if (res.success) {
                                                            toast.success(newStatus ? "Marked as Arrived" : "Reverted to Pending");
                                                            // Remove from current view after toggle
                                                            setWaivers(prev => prev.filter(w => w.id !== id));
                                                        } else {
                                                            // Revert optimistic update on failure
                                                            setWaivers(prev => prev.map(w => w.id === id ? { ...w, is_verified: !newStatus } : w));
                                                            toast.error(res.error || "Failed to update status");
                                                            throw new Error(res.error || "Failed to update status");
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>

                                        {/* 6. Actions */}
                                        <td className="px-6 py-4 text-right">
                                            {waiver.isPrimary ? (
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/admin/waivers/${waiver.id}`}
                                                        className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-200 shadow-sm hover:shadow"
                                                        title="View Full Details"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDownloadPDF(waiver.id)}
                                                        className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-200 shadow-sm hover:shadow"
                                                        title="Download PDF"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t-2 border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100">
                    <p className="text-sm text-slate-600 font-medium">
                        Showing <span className="font-bold text-slate-900">{filteredWaivers.length}</span> of <span className="font-bold text-slate-900">{waivers.length}</span> waivers
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-blue-200 border-2 border-blue-400"></div>
                            <span>Session</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-purple-200 border-2 border-purple-400"></div>
                            <span>Party</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
