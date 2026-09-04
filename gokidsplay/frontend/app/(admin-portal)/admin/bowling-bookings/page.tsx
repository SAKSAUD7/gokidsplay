"use client";

import { useState, useEffect } from "react";
import { toggleBookingArrival } from "@/app/actions/admin";
import { formatDate } from "@/lib/format-utils";
import { DateFilter, filterBookingsByDate } from "@/components/admin/DateFilter";
import { ArrivedToggle } from "@/components/admin/ArrivedToggle";
import { WaiverLink } from "../components/WaiverLink";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/admin/Button";
import { EmptyState } from "@/components/admin/EmptyState";
import { toast } from "sonner";
import { RefreshCw, Edit, Eye, Plus, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BowlingBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [displayCount, setDisplayCount] = useState(25);
    const router = useRouter();

    useEffect(() => { loadBookings(); }, []);
    useEffect(() => { filterBookings(); }, [searchTerm, statusFilter, dateFilter, bookings]);

    async function loadBookings() {
        try {
            setLoading(true);
            const response = await fetch('/api/bookings?type=SESSION&activity=ten-pin-bowling&page_size=100', {
                credentials: 'include',
                cache: 'no-store',
            });
            if (!response.ok) throw new Error('Failed to load bookings');
            const data = await response.json();
            const all = Array.isArray(data) ? data : (data.results ?? []);
            const bowling = all.filter((b: any) => {
                const act = (b.activity || b.activity_type || "").toLowerCase();
                return act.includes("bowling");
            });
            setBookings(bowling);
            setFilteredBookings(bowling);
        } catch (error) {
            toast.error('Failed to load bowling bookings');
            setBookings([]);
            setFilteredBookings([]);
        } finally {
            setLoading(false);
        }
    }

    function filterBookings() {
        let filtered = [...bookings];
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(b =>
                b.name?.toLowerCase().includes(s) ||
                b.email?.toLowerCase().includes(s) ||
                b.id?.toString().includes(s)
            );
        }
        if (statusFilter !== "all") {
            filtered = filtered.filter(b =>
                (b.booking_status || b.status || "").toUpperCase() === statusFilter.toUpperCase()
            );
        }
        filtered = filterBookingsByDate(filtered, dateFilter);
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setFilteredBookings(filtered);
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="text-4xl mb-4">🎳</div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
            </div>
        </div>
    );

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="🎳 Bowling Bookings"
                description={`${filteredBookings.length} ten-pin bowling session${filteredBookings.length !== 1 ? 's' : ''}`}
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin" },
                    { label: "Bowling Bookings" },
                ]}
                actions={
                    <Button
                        variant="primary"
                        icon={<Plus size={16} />}
                        onClick={() => router.push("/admin/session-bookings/new")}
                    >
                        New Bowling Booking
                    </Button>
                }
            />

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Search</label>
                        <input
                            type="text"
                            placeholder="Name, email or booking #"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-blue-100">
                    <p className="text-sm text-slate-600">
                        Showing <span className="font-semibold text-blue-600">{Math.min(filteredBookings.length, displayCount)}</span> of <span className="font-semibold">{filteredBookings.length}</span> bowling bookings
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => { setSearchTerm(""); setStatusFilter("all"); setDateFilter("all"); }} icon={<RefreshCw size={14} />}>
                        Reset
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-blue-50 border-b-2 border-blue-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-blue-700 uppercase tracking-wider">Booking #</th>
                                <th className="px-6 py-4 text-xs font-bold text-blue-700 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-blue-700 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-blue-700 uppercase tracking-wider">Guests</th>
                                <th className="px-6 py-4 text-xs font-bold text-blue-700 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-blue-700 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-4 text-xs font-bold text-blue-700 uppercase tracking-wider">Arrival</th>
                                <th className="px-6 py-4 text-xs font-bold text-blue-700 uppercase tracking-wider">Waiver</th>
                                <th className="px-6 py-4 text-xs font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16">
                                        <EmptyState
                                            icon={<span className="text-5xl">🎳</span>}
                                            title="No bowling bookings found"
                                            description="No ten-pin bowling sessions match your filters"
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.slice(0, displayCount).map((booking: any) => (
                                    <tr key={booking.id} className="hover:bg-blue-50/30 transition-all duration-200">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-900">#{booking.booking_number || booking.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-900">{booking.name}</span>
                                                <span className="text-xs text-slate-500">{booking.email}</span>
                                                <span className="text-xs text-slate-400">{booking.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900">{formatDate(booking.date)}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Clock size={11} /> {booking.time}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700">
                                            {booking.adults}A / {booking.kids}K
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-900">£{Number(booking.amount || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const ps = (booking.payment_status || 'PENDING').toUpperCase();
                                                const styles: Record<string, string> = {
                                                    PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
                                                    REFUNDED: 'bg-blue-100 text-blue-700 border-blue-200',
                                                    FAILED: 'bg-red-100 text-red-700 border-red-200',
                                                };
                                                return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${styles[ps] || styles.PENDING}`}>{ps}</span>;
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ArrivedToggle
                                                bookingId={booking.id}
                                                arrived={booking.arrived}
                                                onToggle={async (id, newStatus) => {
                                                    setBookings(prev => prev.map(b =>
                                                        String(b.id) === String(id) ? { ...b, arrived: newStatus } : b
                                                    ));
                                                    const result = await toggleBookingArrival(id.toString(), 'session', newStatus);
                                                    if (!result.success) {
                                                        setBookings(prev => prev.map(b =>
                                                            String(b.id) === String(id) ? { ...b, arrived: !newStatus } : b
                                                        ));
                                                        toast.error("Failed to update arrival");
                                                        throw new Error();
                                                    }
                                                    toast.success(newStatus ? "Marked as arrived" : "Unmarked");
                                                }}
                                                type="session"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <WaiverLink bookingId={booking.id} status={booking.waiver_status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/bookings/${booking.id}`} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="View">
                                                    <Eye size={18} />
                                                </Link>
                                                <Link href={`/admin/bookings/${booking.id}/edit`} className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                                                    <Edit size={18} />
                                                </Link>
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
