"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Search,
    Filter,
    Download,
    Loader2,
    CheckCircle,
    Circle
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import Link from "next/link";
import { exportBookingsToCSV } from "../../../../lib/export-csv";
import { DateFilter, filterBookingsByDate } from "@/components/admin/DateFilter";
import { deletePartyBooking, deleteBooking, toggleBookingArrival } from "@/app/actions/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Booking {
    id: string;
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    amount: number;
    status: string;
    paymentStatus: string;
    waiverStatus: string;
    adults: number;
    kids: number;
    spectators: number;
    type: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    bookingStatus?: string;
    createdAt?: string;
    has_arrived?: boolean;
}

interface BookingTableProps {
    bookings: Booking[];
    title: string;
    type: "party" | "session";
    readOnly?: boolean;
}

export function BookingTable({ bookings, title, type, readOnly = false }: BookingTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState("all");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingArrival, setTogglingArrival] = useState<string | null>(null);

    let filteredBookings = bookings.filter(booking => {
        const matchesSearch =
            booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(booking.id).toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Apply date filter
    filteredBookings = filterBookingsByDate(filteredBookings, dateFilter);

    const handleDelete = async (id: string, bookingName: string) => {
        if (!confirm(`Are you sure you want to delete the booking for ${bookingName}? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(id);
        try {
            let success;
            if (type === "party") {
                success = await deletePartyBooking(id);
            } else {
                success = await deleteBooking(id);
            }

            if (success) {
                toast.success("Booking deleted successfully");
                router.refresh();
            } else {
                toast.error("Failed to delete booking");
            }
        } catch (error) {
            toast.error("An error occurred while deleting the booking");
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (id: string) => {
        // Navigate to edit page (you can implement this later)
        router.push(`/admin/${type}-bookings/${id}/edit`);
    };

    const handleToggleArrival = async (id: string, currentStatus: boolean) => {
        setTogglingArrival(id);
        try {
            const result = await toggleBookingArrival(id, type, !currentStatus);
            if (result.success) {
                toast.success(currentStatus ? "Marked as not arrived" : "Marked as arrived");
                router.refresh();
            } else {
                toast.error("Failed to update arrival status");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setTogglingArrival(null);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    <p className="text-sm text-slate-500">Manage your {type} bookings</p>
                </div>
                <div className="flex items-center gap-3">
                    {!readOnly && (
                        <Link
                            href={`/admin/${type}-bookings/new`}
                            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            New Booking
                        </Link>
                    )}
                    <button
                        onClick={() => exportBookingsToCSV(filteredBookings, `${type}-bookings`)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                        >
                            <option value="ALL">All Status</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PENDING">Pending</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <DateFilter value={dateFilter} onChange={setDateFilter} />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Booking Details</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Guests</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    No bookings found matching your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">
                                            {format(new Date(booking.date), "MMM d, yyyy")}
                                        </div>
                                        <div className="text-slate-500 text-xs mt-0.5">
                                            {booking.time} • {String(booking.id).slice(-6).toUpperCase()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{booking.name}</div>
                                        <div className="text-slate-500 text-xs mt-0.5">{booking.email}</div>
                                        <div className="text-slate-500 text-xs">{booking.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900">
                                            {booking.kids + booking.adults + booking.spectators} Total
                                        </div>
                                        <div className="text-slate-500 text-xs mt-0.5">
                                            {booking.kids} Kids, {booking.adults} Adults
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        £{booking.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={booking.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Arrived Toggle */}
                                            <button
                                                onClick={() => handleToggleArrival(booking.id, booking.has_arrived || false)}
                                                disabled={togglingArrival === booking.id}
                                                className={`p-2 rounded-lg transition-colors ${booking.has_arrived
                                                        ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                                        : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                title={booking.has_arrived ? "Arrived" : "Mark as Arrived"}
                                            >
                                                {togglingArrival === booking.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : booking.has_arrived ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <Circle className="w-4 h-4" />
                                                )}
                                            </button>

                                            {/* View Button */}
                                            <Link
                                                href={`/admin/${type}-bookings/${booking.id}`}
                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>

                                            {!readOnly && type !== 'party' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(booking.id)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(booking.id, booking.name)}
                                                        disabled={deletingId === booking.id}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Delete"
                                                    >
                                                        {deletingId === booking.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Placeholder) */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                <div>Showing {filteredBookings.length} bookings</div>
                <div className="flex gap-2">
                    <button disabled className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">Previous</button>
                    <button disabled className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
}
