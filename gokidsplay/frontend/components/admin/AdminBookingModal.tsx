"use client";

import { X, Calendar, Clock, User, Phone, Mail, Hash, Users, Activity, FileSignature, Edit } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import Link from "next/link";
import { useState } from "react";

export function AdminBookingModal({
    booking,
    onClose,
    onUpdateStatus
}: {
    booking: any;
    onClose: () => void;
    onUpdateStatus?: (id: string, status: string, isPayment: boolean) => Promise<void>;
}) {
    const [isUpdating, setIsUpdating] = useState(false);

    if (!booking) return null;

    const isParty = booking.type === "PARTY";
    const editUrl = isParty ? `/admin/party-bookings/${booking.id}` : `/admin/bookings/${booking.id}`;

    const handleStatusChange = async (newStatus: string, isPayment: boolean) => {
        if (!onUpdateStatus) return;
        setIsUpdating(true);
        try {
            await onUpdateStatus(booking.id, newStatus, isPayment);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 border border-slate-200 animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isParty ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {isParty ? <Users size={24} /> : <Activity size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {isParty ? 'Party Booking' : 'Session Booking'} #{booking.id}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <StatusBadge status={booking.payment_status === 'PENDING' || booking.paymentStatus === 'PENDING' ? 'PENDING' : (booking.booking_status || booking.status)} />
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    
                    {/* Customer Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User size={16} className="text-slate-400" /> Customer Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Name</p>
                                <p className="font-medium text-slate-900">{booking.customer?.name || booking.name || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Email</p>
                                <p className="font-medium text-slate-900 flex items-center gap-1.5">
                                    <Mail size={14} className="text-slate-400" />
                                    {booking.customer?.email || booking.email || 'No Email'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Phone</p>
                                <p className="font-medium text-slate-900 flex items-center gap-1.5">
                                    <Phone size={14} className="text-slate-400" />
                                    {booking.customer?.phone || booking.phone || 'No Phone'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" /> Booking Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Date</p>
                                <p className="font-medium text-slate-900">{formatDate(booking.date)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Time</p>
                                <p className="font-medium text-slate-900 flex items-center gap-1.5">
                                    <Clock size={14} className="text-slate-400" />
                                    {booking.time}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Duration</p>
                                <p className="font-medium text-slate-900">{booking.duration} mins</p>
                            </div>
                            
                            <div className="sm:col-span-3 h-px bg-slate-200 my-2" />

                            <div>
                                <p className="text-xs text-slate-500 mb-1">Participants</p>
                                <p className="font-medium text-slate-900">
                                    {(booking.adults || 0) + (booking.kids || 0)} {(booking.spectators > 0) && <span className="text-slate-500 text-sm">(+{booking.spectators} spectators)</span>}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Total Amount</p>
                                <p className="font-medium text-slate-900">{formatCurrency(booking.amount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Payment Status</p>
                                {onUpdateStatus ? (
                                    <select
                                        disabled={isUpdating}
                                        value={booking.payment_status || booking.paymentStatus || 'PENDING'}
                                        onChange={(e) => handleStatusChange(e.target.value, true)}
                                        className="text-sm border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="PAID">Paid</option>
                                        <option value="FAILED">Failed</option>
                                    </select>
                                ) : (
                                    <p className="font-medium text-slate-900">{booking.payment_status || booking.paymentStatus || 'PENDING'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {isParty && booking.birthday_child_name && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">🎉 Party Specifics</h3>
                            <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center gap-4">
                                <div>
                                    <p className="text-xs text-purple-600 font-semibold mb-1">Celebrant / Event Name</p>
                                    <p className="font-bold text-purple-900">{booking.birthday_child_name} (Age: {booking.birthday_child_age || 'N/A'})</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 justify-end rounded-b-2xl">
                    <Link
                        href={editUrl}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={onClose}
                    >
                        <Edit size={16} />
                        Full Details & Edit
                    </Link>
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
