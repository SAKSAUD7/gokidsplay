"use client";

import { ListFilterBox, matchesText } from "@/components/admin/ListFilterBox";
import { useUrlSearch } from "@/lib/hooks/use-url-search";
import { matchesBookingSearch } from "@/lib/booking-search";
import { useState, useEffect } from "react";
import { getPartyBookingHistory, restorePartyBooking } from "@/app/actions/admin";
import { RestoreConfirmationModal } from "../../components/RestoreConfirmationModal";
import { Calendar, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function PartyBookingHistoryPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useUrlSearch();
    const [restoring, setRestoring] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [displayCount, setDisplayCount] = useState(100);

    useEffect(() => {
        loadHistory();
    }, []);

    async function loadHistory() {
        try {
            const data = await getPartyBookingHistory();
            setHistory(data);
        } catch (error) {
            console.error('Error loading history:', error);
            toast.error("Failed to load booking history");
        } finally {
            setLoading(false);
        }
    }

    function handleRestoreClick(booking: any) {
        setSelectedBooking(booking);
        setShowModal(true);
    }

    async function handleConfirmRestore() {
        if (!selectedBooking) return;

        setRestoring(true);
        try {
            const result = await restorePartyBooking(selectedBooking.id);

            if (result.success) {
                toast.success(result.message || `Party Booking #${result.bookingId} restored successfully!`);
                setShowModal(false);
                setSelectedBooking(null);
                // Reload history to remove restored item
                await loadHistory();
            } else {
                toast.error(result.error || "Failed to restore party booking");
            }
        } catch (error: any) {
            console.error('Restore error:', error);
            toast.error(error.message || "An error occurred while restoring");
        } finally {
            setRestoring(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const shownHistory = history.filter(b => matchesBookingSearch(b, search));

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <Link
                        href="/admin/party-bookings"
                        className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-2 transition-colors text-sm"
                    >
                        <ArrowLeft size={16} />
                        Back to Party Bookings
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-primary" />
                        Party Booking History
                    </h1>
                    <p className="text-slate-600 mt-1">Move Party Bookings That Were Paid But Not Saved</p>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-red-800 font-bold text-base">
                        Warning! Restoring These Bookings From History Will Move The Data To The Party Booking Page.
                    </p>
                    <p className="text-red-700 text-sm mt-1">
                        Be Super Careful When You Use This Facility!
                    </p>
                </div>
            </div>

            {/* Filter Data Section */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Filter Data:</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Display</label>
                        <select
                            value={displayCount}
                            onChange={(e) => setDisplayCount(Number(e.target.value))}
                            className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <p className="text-sm text-slate-600">
                        Displaying {Math.min(displayCount, history.length)} out of {history.length}
                    </p>
                    <p className="text-sm text-slate-600">
                        Page 1 / 1
                    </p>
                </div>
            </div>

            {/* Table */}
            <ListFilterBox value={search} onChange={setSearch} placeholder="Search name, email, phone, booking number or date…"
                shown={shownHistory.length} total={history.length} />
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Party Booking ID #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Customer Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Package
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Amount Checked Out
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Manage
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {shownHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        No party booking history found
                                    </td>
                                </tr>
                            ) : (
                                shownHistory.slice(0, displayCount).map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            {booking.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900">
                                            {booking.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {booking.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900">
                                            {new Date(booking.date).toLocaleDateString()} at {booking.time}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {booking.packageName || "Standard"}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                            £{parseFloat(booking.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleRestoreClick(booking)}
                                                disabled={!booking.canRestore}
                                                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Restore?
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Restore Confirmation Modal */}
            {selectedBooking && (
                <RestoreConfirmationModal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedBooking(null);
                    }}
                    onConfirm={handleConfirmRestore}
                    bookingData={{
                        id: selectedBooking.id,
                        name: selectedBooking.name,
                        email: selectedBooking.email,
                        date: new Date(selectedBooking.date).toLocaleDateString(),
                        time: selectedBooking.time,
                        amount: parseFloat(selectedBooking.amount),
                        type: "party"
                    }}
                    loading={restoring}
                />
            )}
        </div>
    );
}
