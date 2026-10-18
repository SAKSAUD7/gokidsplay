"use client";

import { useUrlSearch } from "@/lib/hooks/use-url-search";
import { matchesBookingSearch } from "@/lib/booking-search";
import { useState, useEffect } from "react";
import { getAllBookings } from "@/app/actions/admin";
import { formatDate, formatCurrency, getInitials } from "@/lib/format-utils";
import { exportBookingsToCSV } from "../../../../lib/export-csv";
import { DateFilter, filterBookingsByDate } from "@/components/admin/DateFilter";
import { clearCacheByPrefix } from "@/lib/admin-cache";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/admin/Button";
import { EmptyState } from "@/components/admin/EmptyState";
import { toast } from 'sonner';
import {
    Search,
    Download,
    Calendar,
    Clock,
    Mail,
    Phone,
    Eye,
    Filter
} from "lucide-react";
import Link from "next/link";
import { AdminBookingModal } from "@/components/admin/AdminBookingModal";
import { updateBookingStatus, updatePartyBookingStatus } from "@/app/actions/admin";

export default function AllBookingsPage() {
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useUrlSearch();
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    useEffect(() => {
        loadBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [searchTerm, typeFilter, statusFilter, dateFilter, allBookings]);

    async function loadBookings() {
        try {
            setLoading(true);

            // Use server action instead of client-side fetch
            const data = await getAllBookings();

            if (!data || data.length === 0) {
                console.log('[ALL BOOKINGS PAGE] No bookings found');
                toast.info('No bookings found');
            } else {
                console.log('[ALL BOOKINGS PAGE] Loaded', data.length, 'bookings');
                toast.success(`Loaded ${data.length} bookings`);
            }

            setAllBookings(data);
            setFilteredBookings(data);
        } catch (error) {
            console.error("[ALL BOOKINGS PAGE] Error loading all bookings:", error);
            toast.error('Failed to load bookings: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    }

    function filterBookings() {
        let filtered = [...allBookings];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(booking => matchesBookingSearch(booking, searchTerm));
        }

        // Type filter
        if (typeFilter) {
            filtered = filtered.filter(booking =>
                booking.type?.toUpperCase() === typeFilter.toUpperCase()
            );
        }

        // Status filter
        if (statusFilter) {
            filtered = filtered.filter(booking =>
                (booking.booking_status || booking.status)?.toUpperCase() === statusFilter.toUpperCase()
            );
        }

        // Date filter
        filtered = filterBookingsByDate(filtered, dateFilter);

        setFilteredBookings(filtered);
    }

    async function handleStatusUpdate(id: string, newStatus: string, isPayment: boolean) {
        const booking = selectedBooking;
        if (!booking) return;
        try {
            if (booking.type === 'PARTY') {
                await updatePartyBookingStatus(String(id), newStatus);
            } else {
                await updateBookingStatus(String(id), newStatus);
            }
            // Refresh bookings list
            await loadBookings();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Booking Detail Popup Modal */}
            {selectedBooking && (
                <AdminBookingModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onUpdateStatus={handleStatusUpdate}
                />
            )}

            <PageHeader
                title="All Bookings"
                description="Unified view of all session and party bookings"
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin" },
                    { label: "All Bookings" },
                ]}
                actions={
                    <Button
                        variant="secondary"
                        icon={<Download size={16} />}
                        onClick={() => exportBookingsToCSV(filteredBookings, 'all-bookings')}
                    >
                        Export CSV
                    </Button>
                }
            />

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Booking number (GK… / GP…), name, email or phone"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400 transition-all"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="">All Types</option>
                            <option value="SESSION">Session Bookings</option>
                            <option value="PARTY">Party Bookings</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="">All Statuses</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PENDING">Pending</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                        <DateFilter value={dateFilter} onChange={setDateFilter} />
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                        Showing <span className="font-semibold text-slate-900">{filteredBookings.length}</span> of <span className="font-semibold text-slate-900">{allBookings.length}</span> bookings
                        {(typeFilter || statusFilter || dateFilter !== 'all' || searchTerm) && (
                            <span className="ml-2 text-blue-600">• Filters active</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Booking Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Guests</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16">
                                        <EmptyState
                                            icon={<Filter size={48} />}
                                            title="No bookings found"
                                            description="Try adjusting your filters or search terms to find bookings"
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking: any) => (
                                    <tr key={`${booking.type}-${booking.id}`} className="hover:bg-blue-50/30 transition-all duration-200 group">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${booking.type?.toUpperCase() === 'SESSION'
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                : 'bg-purple-100 text-purple-700 border border-purple-200'
                                                }`}>
                                                {booking.type?.toUpperCase() || 'PARTY'}
                                            </span>
                                            {booking.booking_number && (
                                                <span className="block mt-1.5 font-mono text-xs font-bold text-slate-700">{booking.booking_number}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-sm">
                                                    {getInitials(booking.customer?.name || booking.name || 'U')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{booking.customer?.name || booking.name || 'Unknown'}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                                                        <Mail size={12} /> {booking.customer?.email || booking.email || 'No Email'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                                                        <Phone size={12} /> {booking.customer?.phone || booking.phone || 'No Phone'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {formatDate(booking.date)}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Clock size={12} />
                                                    {booking.time}
                                                </div>
                                                <div className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded inline-block">
                                                    ID: #{String(booking.id).slice(-6)}
                                                </div>
                                                {booking.type === 'PARTY' && booking.birthday_child_name && (
                                                    <div className="text-xs text-purple-600 mt-1 font-medium">
                                                        🎂 {booking.birthday_child_name} ({booking.birthday_child_age}y)
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-900">{booking.duration} mins</p>
                                            <p className="text-xs text-slate-600">{(booking.adults || 0) + (booking.kids || 0) + (booking.spectators || 0)} Guests</p>
                                            <p className="text-sm font-bold text-slate-900 mt-1">{formatCurrency(booking.amount)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={(booking.booking_status || booking.status) === 'CANCELLED' ? 'CANCELLED' : (booking.payment_status === 'PENDING' || booking.paymentStatus === 'PENDING' ? 'PENDING' : (booking.booking_status || booking.status))} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedBooking(booking)}
                                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <Eye size={16} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                    <p className="text-sm text-slate-600">
                        Showing <span className="font-semibold text-slate-900">{filteredBookings.length}</span> of <span className="font-semibold text-slate-900">{allBookings.length}</span> bookings
                    </p>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-300",
        PENDING: "bg-amber-100 text-amber-700 border-amber-300",
        CANCELLED: "bg-red-100 text-red-700 border-red-300",
        COMPLETED: "bg-blue-100 text-blue-700 border-blue-300",
    };

    const defaultStyle = "bg-slate-100 text-slate-700 border-slate-300";

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${styles[status] || defaultStyle} inline-flex items-center gap-1.5`}>
            <span className={`w-2 h-2 rounded-full ${status === 'CONFIRMED' ? 'bg-emerald-500' : status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-400'}`} />
            {status}
        </span>
    );
}
