"use client";
import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Users, Calendar, Clock, PoundSterling, CheckCircle, AlertCircle, Edit, XCircle, CreditCard, Loader2, Copy, History, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'session' | 'party';
    bookingId: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    participants: number;
    kids: number;
    adults: number;
    status: string;
    amount: number;
    arrived: boolean;
    packageName: string;
    birthdayChildName?: string;
    birthdayChildAge?: number;
}

interface BookingDetailsModalProps {
    event: CalendarEvent;
    onClose: () => void;
    onRefresh: () => void;
}

interface AuditEntry {
    id: number;
    field_changed: string;
    old_value: string | null;
    new_value: string | null;
    changed_by: string | null;
    timestamp: string;
}

interface DuplicateModalProps {
    event: CalendarEvent;
    onClose: () => void;
    onSuccess: (newBookingId: number) => void;
}

function DuplicateModal({ event, onClose, onSuccess }: DuplicateModalProps) {
    const [date, setDate] = useState(format(event.start, 'yyyy-MM-dd'));
    const [time, setTime] = useState(format(event.start, 'HH:mm'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDuplicate = async () => {
        if (!date || !time) {
            setError('Please select a date and time.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const endpoint = event.type === 'session'
                ? `/api/bookings/${event.bookingId}/duplicate`
                : null;

            if (!endpoint) {
                setError('Duplication is only supported for session bookings.');
                setLoading(false);
                return;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ date, time }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || err.detail || 'Duplication failed');
            }

            const data = await res.json();
            onSuccess(data.id);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Copy size={20} className="text-indigo-600" />
                        Duplicate Booking
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                    Create a copy of this booking for <strong>{event.customerName}</strong> on a new date and time. The new booking will start as <span className="font-semibold text-amber-700 bg-amber-50 px-1 rounded">PENDING</span>.
                </p>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                <div className="space-y-3 mb-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">New Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">New Time</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDuplicate}
                        disabled={loading}
                        className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                        {loading ? 'Creating...' : 'Create Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export const BookingDetailsModal = ({ event, onClose, onRefresh }: BookingDetailsModalProps) => {
    const isSession = event.type === 'session';
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [cancelled, setCancelled] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [arrived, setArrived] = useState(event.arrived);
    const [error, setError] = useState<string | null>(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'history') {
            loadAuditLog();
        }
    }, [activeTab]);

    const loadAuditLog = async () => {
        setAuditLoading(true);
        try {
            const endpoint = isSession
                ? `/api/bookings/${event.bookingId}/audit_log`
                : `/api/party-bookings/${event.bookingId}/audit_log`;
            const res = await fetch(endpoint, { credentials: 'include', cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setAuditLog(Array.isArray(data) ? data : []);
            }
        } catch {
            setAuditLog([]);
        } finally {
            setAuditLoading(false);
        }
    };

    const handleUpdateStatus = async (updates: Record<string, any>, label: string) => {
        setActionLoading(label);
        setError(null);
        const endpoint = isSession ? `/api/bookings/${event.bookingId}` : `/api/party-bookings/${event.bookingId}`;
        try {
            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(updates),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || err.detail || 'Update failed');
            }
            if (updates.booking_status === 'CANCELLED' || updates.status === 'CANCELLED') setCancelled(true);
            if (updates.booking_status === 'CONFIRMED' || updates.status === 'CONFIRMED') setConfirmed(true);
            if ('arrived' in updates) setArrived(updates.arrived);
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewBooking = () => {
        const url = isSession
            ? `/admin/bookings/${event.bookingId}`
            : `/admin/party-bookings/${event.bookingId}`;
        window.location.href = url;
    };

    const getFieldLabel = (field: string) => {
        const labels: Record<string, string> = {
            booking_status: 'Booking Status',
            payment_status: 'Payment Status',
            arrived: 'Arrival Status',
            created_via_duplicate: 'Booking Created',
            status: 'Status',
        };
        return labels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getFieldIcon = (field: string) => {
        if (field.includes('status')) return '📋';
        if (field.includes('arrived')) return '📍';
        if (field.includes('duplicate')) return '📄';
        return '✏️';
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className={`p-6 ${isSession ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-purple-500 to-purple-600'} text-white rounded-t-2xl flex-shrink-0`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{isSession ? '🎯' : '🎉'}</span>
                                    <h2 className="text-xl font-bold">{event.title}</h2>
                                </div>
                                <p className="text-white/80 text-sm">
                                    {isSession ? 'Session Booking' : 'Party Booking'} · #{event.bookingId}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {isSession && (
                                    <button
                                        onClick={() => setShowDuplicateModal(true)}
                                        className="flex items-center gap-1.5 py-1.5 px-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
                                        title="Duplicate this booking to a new date/time"
                                    >
                                        <Copy size={16} />
                                        Duplicate
                                    </button>
                                )}
                                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                                activeTab === 'details'
                                    ? 'border-blue-600 text-blue-700 bg-white'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Users size={16} />
                            Details
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                                activeTab === 'history'
                                    ? 'border-blue-600 text-blue-700 bg-white'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <History size={16} />
                            Audit Trail
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'details' && (
                            <div className="space-y-5">
                                {/* Status Badges */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
                                        cancelled ? 'bg-red-100 text-red-800 border-red-300' :
                                        arrived ? 'bg-green-100 text-green-800 border-green-300' :
                                        'bg-orange-100 text-orange-800 border-orange-300'
                                    }`}>
                                        {cancelled ? <XCircle size={18} /> : arrived ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                        <span className="font-bold">{cancelled ? 'Cancelled' : arrived ? 'Arrived' : 'Not Arrived'}</span>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg font-bold ${
                                        cancelled ? 'bg-red-100 text-red-800' :
                                        confirmed ? 'bg-green-100 text-green-800' :
                                        event.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                                        event.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-slate-100 text-slate-800'
                                    }`}>
                                        {cancelled ? 'CANCELLED' : confirmed ? 'CONFIRMED' : event.status?.toUpperCase()}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Customer Information */}
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <h3 className="font-bold text-base mb-3 text-slate-900">Customer Information</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <User size={17} className="text-slate-500" />
                                            <span className="font-semibold text-slate-900">{event.customerName}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail size={17} className="text-slate-500" />
                                            <span className="text-slate-700">{event.customerEmail}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone size={17} className="text-slate-500" />
                                            <span className="text-slate-700">{event.customerPhone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Details */}
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <h3 className="font-bold text-base mb-3 text-slate-900">Booking Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <Calendar size={17} className="text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Date</p>
                                                <p className="font-semibold text-slate-900">{format(event.start, 'MMM dd, yyyy')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Clock size={17} className="text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Time</p>
                                                <p className="font-semibold text-slate-900">
                                                    {format(event.start, 'hh:mm a')} – {format(event.end, 'hh:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Users size={17} className="text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Participants</p>
                                                <p className="font-semibold text-slate-900">
                                                    {event.participants} ({event.adults} Adults, {event.kids} Kids)
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <PoundSterling size={17} className="text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Amount</p>
                                                <p className="font-semibold text-slate-900">£{event.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {event.packageName && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600">
                                            <span className="font-semibold">Package:</span> {event.packageName}
                                        </div>
                                    )}

                                    {/* Party-specific details */}
                                    {!isSession && event.birthdayChildName && (
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">🎂</span>
                                                <div>
                                                    <p className="text-xs text-slate-500">Celebrant / Event Name</p>
                                                    <p className="font-semibold text-slate-900">
                                                        {event.birthdayChildName} (Age: {event.birthdayChildAge || 'N/A'})
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="space-y-3">
                                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Quick Actions</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {!cancelled && !arrived && (
                                            <button
                                                onClick={() => handleUpdateStatus({ arrived: true }, 'arrived')}
                                                disabled={!!actionLoading}
                                                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                                            >
                                                {actionLoading === 'arrived' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                                Mark Arrived
                                            </button>
                                        )}
                                        {!cancelled && (event.status === 'PENDING' || event.status === 'pending') && (
                                            <button
                                                onClick={() => handleUpdateStatus(
                                                    isSession ? { booking_status: 'CONFIRMED', payment_status: 'PAID' } : { status: 'CONFIRMED' },
                                                    'confirm'
                                                )}
                                                disabled={!!actionLoading}
                                                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                                            >
                                                {actionLoading === 'confirm' ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                                Confirm & Pay
                                            </button>
                                        )}
                                        <button
                                            onClick={handleViewBooking}
                                            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-white transition-colors text-sm ${
                                                isSession ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'
                                            }`}
                                        >
                                            <Edit size={16} /> Full Details
                                        </button>
                                        {!cancelled && (
                                            <button
                                                onClick={() => {
                                                    if (!confirm(`Cancel ${isSession ? 'session' : 'party'} booking for ${event.customerName}?`)) return;
                                                    handleUpdateStatus(
                                                        isSession ? { booking_status: 'CANCELLED' } : { status: 'CANCELLED' },
                                                        'cancel'
                                                    );
                                                }}
                                                disabled={!!actionLoading}
                                                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors disabled:opacity-50 text-sm"
                                            >
                                                {actionLoading === 'cancel' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                                Cancel Booking
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-900 text-base">Change History</h3>
                                    <button
                                        onClick={loadAuditLog}
                                        className="text-xs text-slate-500 hover:text-slate-700 underline"
                                    >
                                        Refresh
                                    </button>
                                </div>

                                {auditLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 size={32} className="animate-spin text-slate-400" />
                                    </div>
                                ) : auditLog.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <History size={40} className="text-slate-300 mb-3" />
                                        <p className="text-slate-500 font-medium">No changes recorded yet</p>
                                        <p className="text-slate-400 text-sm mt-1">Status changes will appear here automatically</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        {/* Timeline line */}
                                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

                                        <div className="space-y-4">
                                            {auditLog.map((entry, idx) => (
                                                <div key={entry.id} className="relative flex gap-4 pl-10">
                                                    {/* Timeline dot */}
                                                    <div className="absolute left-2.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm mt-1" />

                                                    <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base">{getFieldIcon(entry.field_changed)}</span>
                                                                <span className="font-semibold text-slate-800 text-sm">
                                                                    {getFieldLabel(entry.field_changed)}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                                {format(new Date(entry.timestamp), 'MMM dd, HH:mm')}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-sm">
                                                            {entry.old_value && (
                                                                <>
                                                                    <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-mono text-xs">
                                                                        {entry.old_value}
                                                                    </span>
                                                                    <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                                                                </>
                                                            )}
                                                            <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded font-mono text-xs">
                                                                {entry.new_value || 'N/A'}
                                                            </span>
                                                        </div>

                                                        {entry.changed_by && (
                                                            <p className="text-xs text-slate-400 mt-2">
                                                                by <span className="font-medium text-slate-600">{entry.changed_by}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Duplicate Modal */}
            {showDuplicateModal && (
                <DuplicateModal
                    event={event}
                    onClose={() => setShowDuplicateModal(false)}
                    onSuccess={(newId) => {
                        setShowDuplicateModal(false);
                        onRefresh();
                        alert(`✅ Booking duplicated! New Booking ID: #${newId}. You can find it in Session Bookings.`);
                        onClose();
                    }}
                />
            )}
        </>
    );
};
