"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Check, X, Printer, Mail, Users, User, CheckCircle,
    FileSignature, Cake, Share2, CheckCheck, Clock, AlertCircle,
    RefreshCw, Shield, Calendar as CalendarIcon, CreditCard
} from "lucide-react";
import { PartyBookingPDF } from "../../../../../components/PartyBookingPDF";
import { PaymentHistoryCard } from "../../components/PaymentHistoryCard";
import { reschedulePartyBooking } from "@/app/actions/admin";

export default function PartyBookingDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [booking, setBooking] = useState<any>(null);
    const [waivers, setWaivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [resending, setResending] = useState(false);
    const [refreshingWaivers, setRefreshingWaivers] = useState(false);

    // Reschedule state
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

    const loadBookingData = useCallback(async () => {
        try {
            const bookingResponse = await fetch(`/api/bookings/${params.id}?type=PARTY`, {
                credentials: 'include',
                cache: 'no-store',
            });

            if (bookingResponse.ok) {
                const bookingData = await bookingResponse.json();
                setBooking(bookingData);

                // Fetch waivers scoped to this party booking (server-side filtered)
                const waiversResponse = await fetch(
                    `/api/waivers?party_booking_id=${bookingData.id}`,
                    { credentials: 'include', cache: 'no-store' }
                );
                if (waiversResponse.ok) {
                    const waiversData = await waiversResponse.json();
                    setWaivers(Array.isArray(waiversData) ? waiversData : waiversData.results ?? []);
                }
            }
        } catch (error) {
            console.error('Error loading party booking:', error);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => { loadBookingData(); }, [loadBookingData]);

    const refreshWaivers = async () => {
        setRefreshingWaivers(true);
        await loadBookingData();
        setRefreshingWaivers(false);
    };

    const handlePrint = () => window.print();

    const handleShare = async () => {
        const url = `${window.location.origin}/admin/party-bookings/${params.id}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            prompt('Copy this booking link:', url);
        }
    };

    const handleResendEmail = async () => {
        setResending(true);
        try {
            const res = await fetch(`/api/bookings/${params.id}/resend-email`, { method: 'POST', credentials: 'include' });
            alert(res.ok ? 'Confirmation email resent!' : 'Email resend failed — check SMTP settings in backend/.env');
        } catch { alert('Email resend failed.'); }
        finally { setResending(false); }
    };

    const handleUpdateStatus = async (updates: any) => {
        try {
            const response = await fetch(`/api/bookings/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ type: 'PARTY', ...updates }),
                cache: 'no-store',
            });
            if (response.ok) {
                setBooking(await response.json());
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleReschedule = async () => {
        if (!newDate || !newTime) {
            alert("Please select both date and time");
            return;
        }
        setIsSubmittingReschedule(true);
        try {
            const res = await reschedulePartyBooking(params.id, newDate, newTime);
            if (res.success) {
                alert(`Successfully rescheduled! ${res.admin_fee_charged > 0 ? `Admin fee charged: £${res.admin_fee_charged}` : 'No admin fee charged.'}`);
                setIsRescheduling(false);
                await loadBookingData();
            } else {
                alert(res.error || "Failed to reschedule booking");
            }
        } catch (error: any) {
            alert(error.message || "An error occurred");
        } finally {
            setIsSubmittingReschedule(false);
        }
    };

    const calculateAge = (dob: string): number => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    if (loading) return <div className="p-8 text-slate-500">Loading booking...</div>;
    if (!booking) return <div className="p-8 text-red-500">Party booking not found</div>;

    const fmt = (v: any) => `£${Number(v || 0).toFixed(2)}`;

    // ── Waiver tracking ──────────────────────────────────────────────────
    const totalExpected = (booking.adults || 0) + (booking.kids || 0);
    const waiversSigned = waivers.length;
    const waiversRemaining = Math.max(0, totalExpected - waiversSigned);
    const waiverProgress = totalExpected > 0 ? Math.min((waiversSigned / totalExpected) * 100, 100) : 0;

    // Collect all named participants from waivers
    const allSignedAdults: any[] = waivers.flatMap(w => [
        { name: w.name, email: w.email, phone: w.phone, dob: w.dob, isPrimary: true, waiverId: w.id },
        ...(w.adults || []).map((a: any) => ({ ...a, isPrimary: false, waiverId: w.id }))
    ]).filter(a => a.name);
    const allSignedMinors: any[] = waivers.flatMap(w =>
        (w.minors || []).map((m: any) => ({ ...m, waiverId: w.id }))
    ).filter(m => m.name);

    // Participants from booking.participants JSON (added during booking)
    const bookedParticipants = booking.participants || { adults: [], minors: [] };
    const bookedAdults: any[] = bookedParticipants.adults || [];
    const bookedMinors: any[] = bookedParticipants.minors || [];

    const pdfBooking = {
        ...booking,
        participants: {
            adults: allSignedAdults,
            minors: allSignedMinors,
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <Link href="/admin/party-bookings" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Back to Party Bookings
            </Link>

            <div className="flex flex-wrap justify-between items-start mb-8 gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Party #{String(booking.id).padStart(6, '0')}</h1>
                    <p className="text-slate-500 mt-1">
                        Ref: <span className="font-mono font-bold text-purple-600">{booking.booking_number || `SPPARTY-${booking.id}`}</span>
                        {' · '}Created {new Date(booking.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <PartyBookingPDF booking={pdfBooking} className="text-sm" />
                    <button type="button" onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                        {copied ? <><CheckCheck size={16} className="text-green-600" />Copied!</> : <><Share2 size={16} />Share Link</>}
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                        <Printer size={16} /> Print
                    </button>
                    <button onClick={handleResendEmail} disabled={resending}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm disabled:opacity-50">
                        <Mail size={16} /> {resending ? 'Sending...' : 'Resend Email'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Customer Details</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Name</label>
                                <p className="text-slate-900 font-medium">{booking.name}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Email</label>
                                <p className="text-slate-900 font-medium">{booking.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Phone</label>
                                <p className="text-slate-900 font-medium">{booking.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Party Details & Financials */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Party Details & Financials</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Date</label>
                                <p className="text-slate-900 font-medium">{booking.date}</p>
                                {booking.reschedule_count > 0 && (
                                    <p className="text-[10px] text-amber-600 mt-1">Rescheduled {booking.reschedule_count}x</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Time Slot</label>
                                <p className="text-slate-900 font-medium">{booking.time}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Package</label>
                                <p className="text-slate-900 font-medium">{booking.package_name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Dietary Needs</label>
                                <p className="text-slate-900 font-medium text-sm mt-1">{booking.dietary_restrictions || 'None'}</p>
                            </div>
                            <div className="md:col-span-4 border-t border-slate-100 my-2 pt-4" />
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Total Amount</label>
                                <p className="text-lg font-bold text-slate-900">{fmt(booking.amount)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Amount Paid</label>
                                <p className="text-lg font-bold text-blue-600">{fmt(booking.paid_amount)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Balance Due</label>
                                <p className="text-lg font-bold text-red-600">{fmt(booking.remaining_balance)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold">Admin Fees</label>
                                <p className="text-lg font-bold text-amber-600">{fmt(booking.admin_fee_charged)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment History & Gateway Updates */}
                    <PaymentHistoryCard bookingId={booking.id} bookingType="party" />

                    {/* Celebrant / Event Name */}
                    {booking.birthday_child_name && (
                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl shadow-sm border border-pink-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Cake size={20} className="text-pink-600" />
                                Celebrant / Event Name
                            </h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-semibold">Name</label>
                                    <p className="text-slate-900 font-medium">{booking.birthday_child_name}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-semibold">Age</label>
                                    <p className="text-slate-900 font-medium">{booking.birthday_child_age} years old</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Guest Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Users size={20} /> Guest Summary
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-3xl font-bold text-blue-600">{booking.adults || 0}</p>
                                <p className="text-sm text-slate-600 font-medium mt-1">Adults</p>
                            </div>
                            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-3xl font-bold text-amber-600">{booking.kids || 0}</p>
                                <p className="text-sm text-slate-600 font-medium mt-1">Kids</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-700">
                                <span className="font-bold">Total Guests:</span> {(booking.adults || 0) + (booking.kids || 0)} people
                            </p>
                        </div>
                    </div>

                    {/* ── Waiver Progress Tracker ── */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Shield size={20} className="text-purple-600" />
                                Waiver & Participant Tracker
                            </h2>
                            <button
                                onClick={refreshWaivers}
                                disabled={refreshingWaivers}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={13} className={refreshingWaivers ? "animate-spin" : ""} />
                                Refresh
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-5">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600">
                                    <span className="font-bold text-green-600">{waiversSigned}</span> of{" "}
                                    <span className="font-bold">{totalExpected}</span> participants signed
                                </span>
                                {waiversRemaining > 0 ? (
                                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                                        <Clock size={13} /> {waiversRemaining} pending
                                    </span>
                                ) : (
                                    <span className="text-green-600 font-semibold flex items-center gap-1">
                                        <CheckCircle size={13} /> All signed
                                    </span>
                                )}
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${waiverProgress === 100 ? "bg-green-500" : "bg-purple-500"}`}
                                    style={{ width: `${waiverProgress}%` }}
                                />
                            </div>
                        </div>

                        {/* Pending notice */}
                        {waiversRemaining > 0 && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                                <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800">
                                    <strong>{waiversRemaining} participant{waiversRemaining !== 1 ? 's have' : ' has'}</strong> not yet signed a waiver.
                                    They will receive a waiver link via email. This tracker updates automatically when they sign.
                                </p>
                            </div>
                        )}

                        {/* Signed waivers list */}
                        {waivers.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed Participants</p>
                                {waivers.map((waiver: any) => (
                                    <div key={waiver.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                                        {/* Primary signer row */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle size={16} className="text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{waiver.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {waiver.is_primary_signer ? 'Primary signer' : 'Participant'}
                                                        {waiver.participant_type === 'ADULT' ? ' · Adult' : ' · Minor'}
                                                    </p>
                                                    {waiver.email && <p className="text-xs text-slate-500">{waiver.email}</p>}
                                                    {waiver.phone && <p className="text-xs text-slate-500">{waiver.phone}</p>}
                                                    {waiver.dob && <p className="text-xs text-slate-400">DOB: {waiver.dob}</p>}
                                                </div>
                                            </div>
                                            <div>
                                                {waiver.is_verified ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                        <Check size={11} /> Checked In
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-200 text-slate-600">
                                                        <Clock size={11} /> Not Arrived
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Additional adults in this waiver */}
                                        {waiver.adults && waiver.adults.length > 0 && (
                                            <div className="ml-12 mt-3 pl-3 border-l-2 border-purple-200 space-y-1">
                                                <p className="text-xs font-semibold text-slate-400 uppercase">Additional Adults</p>
                                                {waiver.adults.map((a: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm">
                                                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                                                        <span className="font-medium text-slate-800">{a.name}</span>
                                                        {a.email && <span className="text-slate-500 text-xs">({a.email})</span>}
                                                        {a.dob && <span className="text-xs text-slate-400">DOB: {a.dob}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Minors in this waiver */}
                                        {waiver.minors && waiver.minors.length > 0 && (
                                            <div className="ml-12 mt-3 pl-3 border-l-2 border-pink-200 space-y-1">
                                                <p className="text-xs font-semibold text-slate-400 uppercase">Children</p>
                                                {waiver.minors.map((m: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm">
                                                        <span className="w-1.5 h-1.5 bg-pink-400 rounded-full" />
                                                        <span className="font-medium text-slate-800">{m.name}</span>
                                                        {m.dob && (
                                                            <span className="text-xs text-slate-500">
                                                                DOB: {m.dob} (Age {calculateAge(m.dob)})
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                                <FileSignature size={40} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-700 font-medium mb-1">No waivers signed yet</p>
                                <p className="text-sm text-slate-500">
                                    Expecting {booking.adults || 0} adult{(booking.adults || 0) !== 1 ? 's' : ''} and {booking.kids || 0} kid{(booking.kids || 0) !== 1 ? 's' : ''} to sign
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Participants will appear here once they complete the waiver signing process
                                </p>
                            </div>
                        )}

                        {/* Participants added during booking (before waivers) */}
                        {(bookedAdults.length > 0 || bookedMinors.length > 0) && (
                            <div className="mt-5 pt-5 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Pre-registered Participants (added during booking)
                                </p>
                                <div className="space-y-2">
                                    {bookedAdults.map((a: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 text-sm">
                                            <User size={14} className="text-blue-500 flex-shrink-0" />
                                            <span className="text-slate-800 font-medium">{a.name || '(no name)'}</span>
                                            {a.email && <span className="text-slate-500 text-xs">{a.email}</span>}
                                            {a.isPrimary && (
                                                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Primary</span>
                                            )}
                                            {/* Check if this person has signed */}
                                            {a.name && allSignedAdults.some(s => s.name?.toLowerCase() === a.name?.toLowerCase()) ? (
                                                <span className="text-xs text-green-600 flex items-center gap-1 ml-auto">
                                                    <CheckCircle size={11} /> Waiver signed
                                                </span>
                                            ) : (
                                                <span className="text-xs text-amber-600 flex items-center gap-1 ml-auto">
                                                    <Clock size={11} /> Pending waiver
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {bookedMinors.map((m: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 text-sm">
                                            <Cake size={14} className="text-pink-500 flex-shrink-0" />
                                            <span className="text-slate-800 font-medium">{m.name || '(no name)'}</span>
                                            {m.guardian && <span className="text-slate-500 text-xs">Guardian: {m.guardian}</span>}
                                            {m.name && allSignedMinors.some(s => s.name?.toLowerCase() === m.name?.toLowerCase()) ? (
                                                <span className="text-xs text-green-600 flex items-center gap-1 ml-auto">
                                                    <CheckCircle size={11} /> Waiver signed
                                                </span>
                                            ) : (
                                                <span className="text-xs text-amber-600 flex items-center gap-1 ml-auto">
                                                    <Clock size={11} /> Pending waiver
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Status</h2>
                        <div className="mb-6">
                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold 
                ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                    booking.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                                        'bg-red-100 text-red-700'}`}>
                                {booking.status || 'PENDING'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {booking.status !== 'CONFIRMED' && (
                                <button
                                    onClick={() => handleUpdateStatus({ status: 'CONFIRMED' })}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    <Check size={18} /> Approve Party
                                </button>
                            )}

                            {(booking.payment_status === 'PENDING' || !booking.payment_status) && (
                                <button
                                    onClick={() => handleUpdateStatus({ payment_status: 'PAID', status: 'CONFIRMED' })}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                >
                                    <CreditCard size={18} /> Mark as Paid (Cash)
                                </button>
                            )}

                            {booking.status !== 'CANCELLED' && (
                                <button
                                    onClick={() => handleUpdateStatus({ status: 'CANCELLED' })}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                >
                                    <X size={18} /> Cancel Party
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Reschedule Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <CalendarIcon size={20} className="text-purple-600" />
                                Reschedule
                            </h2>
                        </div>
                        {isRescheduling ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">New Date</label>
                                    <input 
                                        type="date" 
                                        value={newDate} 
                                        onChange={(e) => setNewDate(e.target.value)} 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">New Time</label>
                                    <input 
                                        type="time" 
                                        value={newTime} 
                                        onChange={(e) => setNewTime(e.target.value)} 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <button 
                                        onClick={handleReschedule} 
                                        disabled={isSubmittingReschedule}
                                        className="flex-1 bg-purple-600 text-white font-medium py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                                    >
                                        {isSubmittingReschedule ? 'Rescheduling...' : 'Confirm'}
                                    </button>
                                    <button 
                                        onClick={() => setIsRescheduling(false)} 
                                        disabled={isSubmittingReschedule}
                                        className="flex-1 bg-slate-100 text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 text-center">
                                    If rescheduled within 14 days of the party, a £50 admin fee will be charged automatically.
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsRescheduling(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                            >
                                <CalendarIcon size={18} /> Reschedule Party
                            </button>
                        )}
                    </div>

                    {/* Waiver Summary Card in sidebar */}
                    <div className={`rounded-xl border p-5 ${waiverProgress === 100 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Shield size={18} className={waiverProgress === 100 ? 'text-green-600' : 'text-amber-600'} />
                            <h3 className="font-bold text-slate-800 text-sm">Waivers</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-900">
                            {waiversSigned}<span className="text-lg text-slate-400 font-normal"> / {totalExpected}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">participants signed</p>
                        {waiversRemaining > 0 && (
                            <p className="text-xs text-amber-700 mt-3 font-medium">
                                ⏳ {waiversRemaining} still pending
                            </p>
                        )}
                        {waiverProgress === 100 && totalExpected > 0 && (
                            <p className="text-xs text-green-700 mt-3 font-medium flex items-center gap-1">
                                <CheckCircle size={12} /> All waivers complete!
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
