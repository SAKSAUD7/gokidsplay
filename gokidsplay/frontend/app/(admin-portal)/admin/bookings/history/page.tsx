"use client";

import { useUrlSearch } from "@/lib/hooks/use-url-search";
import { useState, useEffect } from "react";
import { getSessionBookings } from "@/app/actions/admin";
import { formatDate, formatCurrency, getInitials } from "@/lib/format-utils";
import { exportBookingsToCSV } from "../../../../../lib/export-csv";
import {
    Search,
    Download,
    Calendar,
    Clock,
    Mail,
    Phone,
    Eye
} from "lucide-react";
import Link from "next/link";

export default function BookingHistoryPage() {
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useUrlSearch();
    const [statusFilter, setStatusFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");

    useEffect(() => {
        loadBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [searchTerm, statusFilter, timeFilter, allBookings]);

    async function loadBookings() {
        try {
            const data = await getSessionBookings();

            // Filter for past bookings
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const pastBookings = data.filter((booking: any) => {
                const bookingDate = new Date(booking.date);
                return bookingDate < today;
            });

            setAllBookings(pastBookings);
            setFilteredBookings(pastBookings);
        } catch (error) {
            console.error("Error loading bookings:", error);
        } finally {
            setLoading(false);
        }
    }

    function filterBookings() {
        let filtered = [...allBookings];

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(booking =>
                booking.customerName?.toLowerCase().includes(search) ||
                booking.customerEmail?.toLowerCase().includes(search) ||
                booking.name?.toLowerCase().includes(search) ||
                booking.email?.toLowerCase().includes(search) ||
                booking.id?.toString().includes(search)
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(booking =>
                (booking.bookingStatus || booking.status)?.toUpperCase() === statusFilter.toUpperCase()
            );
        }

        // Time filter
        if (timeFilter !== "all") {
            const now = new Date();
            const filterDate = new Date();

            switch (timeFilter) {
                case "30":
                    filterDate.setDate(now.getDate() - 30);
                    break;
                case "90":
                    filterDate.setDate(now.getDate() - 90);
                    break;
                case "365":
                    filterDate.setFullYear(now.getFullYear() - 1);
                    break;
            }

            if (timeFilter !== "all") {
                filtered = filtered.filter(booking => {
                    const bookingDate = new Date(booking.date);
                    return bookingDate >= filterDate;
                });
            }
        }

        setFilteredBookings(filtered);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Session Booking History</h1>
                    <p className="text-slate-500 mt-1">View all past session bookings</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/bookings"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
                    >
                        Back to All Bookings
                    </Link>
                    <button
                        onClick={() => exportBookingsToCSV(filteredBookings, 'session-booking-history')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email or booking ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:border-blue-600"
                    >
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:border-blue-600"
                    >
                        <option value="all">All Time</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                        <option value="365">Last Year</option>
                    </select>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Customer Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Booking Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Guests</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No past bookings found
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking: any) => (
                                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                                                    {getInitials(booking.customerName || booking.name || 'U')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{booking.customerName || booking.name || 'Unknown'}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                                                        <Mail size={12} /> {booking.customerEmail || booking.email || 'No Email'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                                                        <Phone size={12} /> {booking.customerPhone || booking.phone || 'No Phone'}
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
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-900">{booking.duration} mins</p>
                                            <p className="text-xs text-slate-600">{(booking.adults || 0) + (booking.kids || 0) + (booking.spectators || 0)} Guests</p>
                                            <p className="text-sm font-bold text-slate-900 mt-1">{formatCurrency(booking.amount)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={booking.bookingStatus || booking.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/bookings/${booking.id}`}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <Eye size={16} />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <p className="text-sm text-slate-600">Showing <span className="font-bold text-slate-900">{filteredBookings.length}</span> of <span className="font-bold text-slate-900">{allBookings.length}</span> past bookings</p>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
        PENDING: "bg-amber-100 text-amber-700 border-amber-200",
        CANCELLED: "bg-red-100 text-red-700 border-red-200",
        COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
    };

    const defaultStyle = "bg-slate-100 text-slate-700 border-slate-200";

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status?.toUpperCase()] || defaultStyle} inline-flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status?.toUpperCase() === 'CONFIRMED' ? 'bg-emerald-500' : status?.toUpperCase() === 'PENDING' ? 'bg-amber-500' : 'bg-slate-400'}`} />
            {status || 'PENDING'}
        </span>
    );
}
