import { getAdminSession } from "@/app/lib/admin-auth";
import { getCustomerById, getCustomerEmails } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, Package, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/format-utils";
import { fetchAPI } from "@/app/lib/server-api";
import { AccountSecurityPanel } from "./AccountSecurityPanel";

async function getCustomerBookings(customerId: string, customerEmail: string) {
    try {
        // Fetch all session bookings and filter by customer
        const [sessionRes, partyRes] = await Promise.all([
            fetchAPI(`/bookings/bookings/?ordering=-created_at`),
            fetchAPI(`/bookings/party-bookings/?ordering=-created_at`),
        ]);

        let sessionBookings: any[] = [];
        let partyBookings: any[] = [];

        if (sessionRes?.ok) {
            const data = await sessionRes.json();
            sessionBookings = (Array.isArray(data) ? data : data.results || []).filter(
                (b: any) =>
                    b.customer === parseInt(customerId) ||
                    b.customer_details?.id === parseInt(customerId) ||
                    b.email === customerEmail
            );
        }

        if (partyRes?.ok) {
            const data = await partyRes.json();
            partyBookings = (Array.isArray(data) ? data : data.results || []).filter(
                (b: any) =>
                    b.customer === parseInt(customerId) ||
                    b.customer_details?.id === parseInt(customerId) ||
                    b.email === customerEmail
            ).map((b: any) => ({ ...b, _isParty: true }));
        }

        return [...sessionBookings, ...partyBookings].sort((a: any, b: any) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    } catch {
        return [];
    }
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const customer = await getCustomerById(params.id);

    if (!customer) {
        return (
            <div className="p-8">
                <Link href="/admin/customers" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                    <ArrowLeft size={18} className="mr-2" /> Back to Customers
                </Link>
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <p className="text-red-600 font-bold text-lg">Customer not found</p>
                    <p className="text-red-400 text-sm mt-1">ID #{params.id} does not exist in the database.</p>
                    <Link href="/admin/customers" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-semibold transition-colors">
                        ← Back to Customers list
                    </Link>
                </div>
            </div>
        );
    }

    const [bookings, emails] = await Promise.all([
        getCustomerBookings(params.id, customer.email),
        getCustomerEmails(params.id)
    ]);
    const totalSpent = parseFloat(customer.total_spent || 0);
    const lastBooking = bookings[0];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <Link href="/admin/customers" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Back to Customers
            </Link>

            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                            {(customer.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{customer.name || 'Unknown Customer'}</h1>
                            <p className="text-slate-500 text-sm mt-0.5">Database ID: #{customer.id}</p>
                            <div className="flex items-center gap-2 mt-1">
                                {(customer.booking_count || 0) > 0 ? (
                                    <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">Active Customer</span>
                                ) : (
                                    <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">No Bookings Yet</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Member Since</p>
                        <p className="text-sm font-medium text-slate-900">{formatDate(customer.created_at || customer.createdAt)}</p>
                        {customer.last_visit && (
                            <>
                                <p className="text-xs text-slate-500 uppercase font-semibold mt-2">Last Visit</p>
                                <p className="text-sm font-medium text-slate-900">{formatDate(customer.last_visit)}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold">Email</p>
                            <p className="text-sm font-medium text-slate-900">{customer.email || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold">Phone</p>
                            <p className="text-sm font-medium text-slate-900">{customer.phone || 'Not provided'}</p>
                        </div>
                    </div>
                </div>

                {customer.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Notes</p>
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{customer.notes}</p>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Bookings</p>
                            <p className="text-3xl font-bold text-slate-900">{customer.booking_count ?? bookings.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Spent</p>
                            <p className="text-3xl font-bold text-emerald-600">
                                £{totalSpent.toFixed(2)}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Last Visit</p>
                            <p className="text-lg font-bold text-slate-900">
                                {customer.last_visit
                                    ? formatDate(customer.last_visit)
                                    : lastBooking
                                        ? formatDate(lastBooking.date)
                                        : 'Never'}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Account & Security — interactive client component */}
            <AccountSecurityPanel customerId={customer.id} customerEmail={customer.email} />

            {/* Booking History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Booking History</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {bookings.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Booking #</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bookings.map((booking: any) => (
                                    <tr key={`${booking._isParty ? 'p' : 's'}-${booking.id}`} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-primary font-mono">
                                                {booking.booking_number || (booking._isParty ? `SPPARTY-${booking.id}` : `SP-${booking.id}`)}
                                            </p>
                                            <p className="text-xs text-slate-400">ID: {booking.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {booking._isParty ? (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">🎉 Party</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                                                    {(booking.activity || '').toLowerCase().includes('skating') ? '🛼 Skating' :
                                                        (booking.activity || '').toLowerCase().includes('bowling') ? '🎳 Bowling' : '🎮 Session'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar size={14} className="text-slate-400" />
                                                {formatDate(booking.date)}
                                            </div>
                                            {booking.time && <p className="text-xs text-slate-400 ml-4">{booking.time}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900">£{parseFloat(booking.amount || 0).toFixed(2)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={booking.booking_status || booking.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={booking._isParty ? `/admin/party-bookings/${booking.id}` : `/admin/bookings/${booking.id}`}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                View →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No bookings found</p>
                        <p className="text-sm text-slate-400 mt-1">This customer hasn't made any bookings yet</p>
                    </div>
                )}
            </div>

            {/* Email History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Email History</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{emails.length} total email{emails.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {emails.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {emails.map((email: any) => (
                                    <tr key={email.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-slate-400" />
                                                <p className="text-sm font-bold text-slate-900">{email.email_type?.replace(/_/g, ' ') || 'Unknown'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600 truncate max-w-xs">{email.subject}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar size={14} className="text-slate-400" />
                                                {formatDate(email.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${
                                                email.status === 'SENT' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                email.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                'bg-red-100 text-red-700 border-red-200'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    email.status === 'SENT' ? 'bg-emerald-500' :
                                                    email.status === 'PENDING' ? 'bg-amber-500' :
                                                    'bg-red-500'
                                                }`} />
                                                {email.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No emails found</p>
                        <p className="text-sm text-slate-400 mt-1">This customer hasn't received any automated emails yet</p>
                    </div>
                )}
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
    const s = (status || '').toUpperCase();
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[s] || "bg-slate-100 text-slate-700 border-slate-200"} inline-flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s === 'CONFIRMED' ? 'bg-emerald-500' : s === 'PENDING' ? 'bg-amber-500' : s === 'CANCELLED' ? 'bg-red-500' : 'bg-slate-400'}`} />
            {s || 'UNKNOWN'}
        </span>
    );
}
