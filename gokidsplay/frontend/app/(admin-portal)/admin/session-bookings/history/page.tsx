"use client";

import { useState, useEffect } from "react";
import { getSessionBookingHistory, restoreSessionBooking } from "@/app/actions/admin";
import { RestoreConfirmationModal } from "../../components/RestoreConfirmationModal";
import { PageHeader } from "@/components/admin/PageHeader";
import { WarningBanner } from "@/components/admin/WarningBanner";
import { Button } from "@/components/admin/Button";
import { Calendar, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SessionBookingHistoryPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [displayCount, setDisplayCount] = useState(100);

    useEffect(() => {
        loadHistory();
    }, []);

    async function loadHistory() {
        try {
            const data = await getSessionBookingHistory();
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
            const result = await restoreSessionBooking(selectedBooking.id);

            if (result.success) {
                toast.success(result.message || `Booking #${result.bookingId} restored successfully!`);
                setShowModal(false);
                setSelectedBooking(null);
                // Reload history to remove restored item
                await loadHistory();
            } else {
                toast.error(result.error || "Failed to restore booking");
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

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Session Booking History"
                description="Restore session bookings that were paid but not saved"
                icon={<Calendar className="w-8 h-8" />}
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin" },
                    { label: "Session Bookings", href: "/admin/bookings" },
                    { label: "History" },
                ]}
                actions={
                    <Link href="/admin/bookings">
                        <Button variant="secondary" icon={<ArrowLeft size={16} />}>
                            Back to Bookings
                        </Button>
                    </Link>
                }
            />

            {/* Warning Banner */}
            <WarningBanner severity="danger">
                <WarningBanner.Title>Irreversible Action - Use With Caution</WarningBanner.Title>
                <WarningBanner.Description>
                    Restoring a booking will <strong>permanently move it to Session Bookings</strong>. This action cannot be undone and may affect your reporting and records. Only restore bookings if you are certain they need to be recovered.
                </WarningBanner.Description>
            </WarningBanner>

            {/* Display Options */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">Show:</label>
                            <select
                                value={displayCount}
                                onChange={(e) => setDisplayCount(Number(e.target.value))}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600">
                        Showing <span className="font-semibold text-slate-900">{Math.min(displayCount, history.length)}</span> of <span className="font-semibold text-slate-900">{history.length}</span> records
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-100 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Booking ID
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Customer Name
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Calendar className="w-12 h-12 text-slate-300" />
                                            <p className="text-base font-medium text-slate-900">No booking history found</p>
                                            <p className="text-sm text-slate-500">Restored bookings will be removed from this list</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                history.slice(0, displayCount).map((booking) => (
                                    <tr key={booking.id} className="hover:bg-amber-50/30 transition-all duration-200 border-b border-slate-100 last:border-b-0">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-900">#{booking.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-900">{booking.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600">{booking.email}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900">
                                                <div className="font-medium">{new Date(booking.date).toLocaleDateString()}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{booking.time}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-900">£{parseFloat(booking.amount).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="warning"
                                                size="sm"
                                                onClick={() => handleRestoreClick(booking)}
                                                disabled={!booking.canRestore}
                                                icon={<RefreshCw className="w-4 h-4" />}
                                            >
                                                Restore
                                            </Button>
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
                        type: "session"
                    }}
                    loading={restoring}
                />
            )}
        </div>
    );
}
