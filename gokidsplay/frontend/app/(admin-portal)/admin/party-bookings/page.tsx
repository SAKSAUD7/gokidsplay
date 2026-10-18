"use client";

import { useDebounced, useUrlSearch } from "@/lib/hooks/use-url-search";
import { matchesBookingSearch } from "@/lib/booking-search";
import { useState, useEffect } from "react";
import { getPartyBookings, toggleBookingArrival } from "@/app/actions/admin";
import { formatDate, formatCurrency, getInitials } from "@/lib/format-utils";
import { exportBookingsToCSV } from "../../../../lib/export-csv";
import { DateFilter, filterBookingsByDate } from "@/components/admin/DateFilter";
import { getCachedData, setCachedData, clearCacheByPrefix } from "@/lib/admin-cache";
import { ArrivedToggle } from "@/components/admin/ArrivedToggle";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/admin/Button";
import { EmptyState } from "@/components/admin/EmptyState";
import { toast } from 'sonner';
import {
    Download,
    Calendar,
    Clock,
    Mail,
    Phone,
    RefreshCw,
    Edit,
    Trash2,
    Package,
    Eye,
    Plus,
    PartyPopper
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PartyBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useUrlSearch();
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [hasArrivedFilter, setHasArrivedFilter] = useState("all");
    const [displayCount, setDisplayCount] = useState(25);
    const router = useRouter();

    // Searching asks the server, so every booking is found — not only the latest 100
    const serverSearch = useDebounced(searchTerm.trim(), 400);
    useEffect(() => {
        loadBookings(serverSearch);
    }, [serverSearch]);

    useEffect(() => {
        filterBookings();
    }, [searchTerm, statusFilter, dateFilter, hasArrivedFilter, bookings]);

    async function loadBookings(search = "") {
        try {
            setLoading(true);

            // Use API route proxy instead of client-side fetch, and limit to recent bookings
            const query = search ? `&search=${encodeURIComponent(search)}&page_size=500` : '&page_size=100';
            const response = await fetch(`/api/bookings?type=PARTY${query}`, {
                credentials: 'include',
                cache: 'no-store',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load bookings');
            }

            const data = await response.json();
            setBookings(data as any[]);
            setFilteredBookings(data as any[]);
        } catch (error) {
            console.error('[Party Bookings] Error:', error);
            toast.error('Failed to load bookings: ' + (error as Error).message);
            setBookings([]);
            setFilteredBookings([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleArrival(id: string, currentStatus: boolean) {
        const result = await toggleBookingArrival(id, 'party', !currentStatus);
        if (result.success) {
            toast.success(currentStatus ? "Marked as not arrived" : "Marked as arrived");

            // Update local state
            setBookings(prev => prev.map(b =>
                String(b.id) === String(id)
                    ? { ...b, arrived: !currentStatus, arrived_at: !currentStatus ? new Date().toISOString() : null }
                    : b
            ));
            return true;
        }
        return false;
    }

    function filterBookings() {
        let filtered = [...bookings];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(booking => matchesBookingSearch(booking, searchTerm));
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(booking =>
                (booking.bookingStatus || booking.status) === statusFilter.toUpperCase()
            );
        }

        // Date filter
        filtered = filterBookingsByDate(filtered, dateFilter);

        // Arrival filter
        if (hasArrivedFilter !== "all") {
            const shouldBeArrived = hasArrivedFilter === "yes";
            filtered = filtered.filter(booking => booking.arrived === shouldBeArrived);
        }

        // Sort by created_at descending (newest first)
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
            const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
            return dateB - dateA; // Descending order (newest first)
        });

        setFilteredBookings(filtered);
    }

    function resetFilters() {
        setSearchTerm("");
        setStatusFilter("all");
        setDateFilter("all");
        setHasArrivedFilter("all");
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
                title="Party Bookings"
                description="View and manage all party bookings"
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin" },
                    { label: "Party Bookings" },
                ]}
                actions={
                    <Button
                        variant="primary"
                        icon={<Plus size={16} />}
                        onClick={() => router.push("/admin/party-bookings/new")}
                    >
                        Create New Booking
                    </Button>
                }
            />

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Search</label>
                        <input
                            type="text"
                            placeholder="Booking number (GP…), name, email or phone"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Date</label>
                        <DateFilter value={dateFilter} onChange={setDateFilter} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Statuses</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Arrival Status</label>
                        <select
                            value={hasArrivedFilter}
                            onChange={(e) => setHasArrivedFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All</option>
                            <option value="yes">Arrived</option>
                            <option value="no">Not Arrived</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Show</label>
                        <select
                            value={displayCount}
                            onChange={(e) => setDisplayCount(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                        Showing <span className="font-semibold text-slate-900">{Math.min(filteredBookings.length, displayCount)}</span> of <span className="font-semibold text-slate-900">{filteredBookings.length}</span> bookings
                    </p>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={resetFilters}
                        icon={<RefreshCw size={14} />}
                    >
                        Reset Filters
                    </Button>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Booking #</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Package / Guests</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Arrival</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-16">
                                        <EmptyState
                                            icon={<PartyPopper size={48} />}
                                            title="No party bookings found"
                                            description="Try adjusting your filters or create a new party booking"
                                            action={
                                                <Button
                                                    variant="primary"
                                                    icon={<Plus size={16} />}
                                                    onClick={() => router.push("/admin/party-bookings/new")}
                                                >
                                                    Create First Party Booking
                                                </Button>
                                            }
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.slice(0, displayCount).map((booking: any) => (
                                    <tr key={booking.uuid || `party-${booking.id}`} className="hover:bg-purple-50/30 transition-all duration-200">
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/party-bookings/${booking.id}`} className="block hover:text-purple-600">
                                                <span className="text-xs font-bold text-purple-600 font-mono">
                                                    {booking.booking_number || `#${booking.id}`}
                                                </span>
                                                <span className="text-xs text-slate-400 block">ID: {booking.id}</span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-900">{booking.customerName || booking.name}</span>
                                                <span className="text-xs text-slate-500">{booking.customerEmail || booking.email}</span>
                                                <span className="text-xs text-slate-500">{booking.customerPhone || booking.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900">{formatDate(booking.date)}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {new Date(booking.date).getFullYear()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900">
                                            {formatTimeRange(booking.time)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Package size={14} className="text-purple-400" />
                                                <span className="text-sm text-slate-900">{booking.packageName || booking.package_name || 'Standard Party'}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                                                <div>👦 {booking.participants || booking.kids || 0} participants</div>
                                                {(booking.spectators || 0) > 0 && <div>👁️ {booking.spectators} spectators</div>}
                                                {booking.birthday_child_name && <div>🎂 {booking.birthday_child_name} (age {booking.birthday_child_age})</div>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={booking.bookingStatus || booking.status || 'PENDING'} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-900">{formatCurrency(booking.amount || 0)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ArrivedToggle
                                                bookingId={booking.id}
                                                arrived={booking.arrived}
                                                onToggle={async (id, newStatus) => {
                                                    // Optimistic update
                                                    setBookings(prev => prev.map(b =>
                                                        String(b.id) === String(id)
                                                            ? { ...b, arrived: newStatus, arrived_at: newStatus ? new Date().toISOString() : null }
                                                            : b
                                                    ));

                                                    const result = await toggleBookingArrival(id.toString(), 'party', newStatus);
                                                    if (result.success) {
                                                        toast.success(newStatus ? "Marked as arrived" : "Marked as not arrived");
                                                    } else {
                                                        // Revert on failure
                                                        setBookings(prev => prev.map(b =>
                                                            String(b.id) === String(id)
                                                                ? { ...b, arrived: !newStatus, arrived_at: !newStatus ? new Date().toISOString() : null }
                                                                : b
                                                        ));
                                                        toast.error("Failed to update arrival status");
                                                        throw new Error("Failed to update arrival status");
                                                    }
                                                }}
                                                type="party"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/party-bookings/${booking.id}`}
                                                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <Link
                                                    href={`/admin/party-bookings/${booking.id}/edit`}
                                                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit Booking"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => toast.info("Delete functionality disabled for safety")}
                                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete Booking"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${styles[status?.toUpperCase()] || defaultStyle} inline-flex items-center gap-1.5`}>
            <span className={`w-2 h-2 rounded-full ${status?.toUpperCase() === 'CONFIRMED' ? 'bg-emerald-500' : status?.toUpperCase() === 'PENDING' ? 'bg-amber-500' : 'bg-slate-400'}`} />
            {status || 'PENDING'}
        </span>
    );
}

function formatTimeRange(startTime: string): string {
    if (!startTime) return "";

    // Party bookings are typically 2 hours
    const durationMinutes = 120;

    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0);

    const end = new Date(start.getTime() + durationMinutes * 60000);

    return `${formatTime(start)} - ${formatTime(end)}`;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).toLowerCase();
}
