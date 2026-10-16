"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, RefreshCw, Phone, Mail, StickyNote, Users } from "lucide-react";
import { PAYMENT_STATUS, RESERVATION_STATUS, longDate, money, shortTime } from "./eventMeta";

interface Reservation {
    id: number;
    booking_reference: string;
    event: number;
    event_title: string;
    event_date: string;
    event_start_time: string;
    name: string;
    email: string;
    phone: string;
    num_children: number;
    num_adults: number;
    special_requirements: string;
    subtotal: string;
    amount_paid: string;
    balance_due: string;
    status: string;
    payment_status: string;
    arrived: boolean;
    notes: string;
    created_at: string;
}

const ACTIVE = (r: Reservation) => !["CANCELLED", "REFUNDED"].includes(r.status);

/** Reservations for one event (eventId) or for every event. */
export function ReservationsTable({ eventId, onChange }: { eventId?: number | string; onChange?: () => void }) {
    const [rows, setRows] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("active");
    const [paymentFilter, setPaymentFilter] = useState("");
    const [busy, setBusy] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/event-bookings${eventId ? `?event_id=${eventId}` : ""}`, { credentials: "include", cache: "no-store" });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setRows(Array.isArray(data) ? data : data.results ?? []);
        } catch {
            toast.error("Could not load reservations");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { load(); }, [load]);

    const act = async (r: Reservation, action: string, confirmText?: string) => {
        if (confirmText && !confirm(confirmText)) return;
        setBusy(r.id);
        try {
            const res = await fetch(`/api/event-bookings?id=${r.id}&action=${action}`, { method: "POST", credentials: "include" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Action failed");
            setRows(list => list.map(x => (x.id === r.id ? { ...x, ...data } : x)));
            onChange?.();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setBusy(null);
        }
    };

    const saveNotes = async (r: Reservation) => {
        const notes = prompt(`Notes for ${r.name} (${r.booking_reference})`, r.notes || "");
        if (notes === null) return;
        const res = await fetch(`/api/event-bookings?id=${r.id}`, {
            method: "PATCH", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes }),
        });
        if (res.ok) { setRows(list => list.map(x => (x.id === r.id ? { ...x, notes } : x))); toast.success("Notes saved"); }
        else toast.error("Could not save notes");
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter(r => {
            if (statusFilter === "active" && !ACTIVE(r)) return false;
            if (statusFilter && statusFilter !== "active" && r.status !== statusFilter) return false;
            if (paymentFilter && r.payment_status !== paymentFilter) return false;
            if (q && ![r.name, r.email, r.phone, r.booking_reference, r.event_title].some(v => (v || "").toLowerCase().includes(q))) return false;
            return true;
        });
    }, [rows, search, statusFilter, paymentFilter]);

    const active = rows.filter(ACTIVE);
    const totals = {
        reservations: active.length,
        guests: active.reduce((s, r) => s + r.num_children + r.num_adults, 0),
        toCollect: active.filter(r => r.payment_status !== "FULLY_PAID").reduce((s, r) => s + (parseFloat(r.balance_due) || 0), 0),
        collected: active.reduce((s, r) => s + (parseFloat(r.amount_paid) || 0), 0),
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Active reservations", value: totals.reservations },
                    { label: "Guests", value: totals.guests },
                    { label: "To collect at venue", value: money(totals.toCollect) },
                    { label: "Collected", value: money(totals.collected) },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                        <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone or reference…"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700">
                    <option value="active">Active reservations</option>
                    <option value="">All statuses</option>
                    {Object.entries(RESERVATION_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700">
                    <option value="">Any payment</option>
                    <option value="PENDING">Pay at venue</option>
                    <option value="FULLY_PAID">Paid</option>
                </select>
                <button onClick={load} className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50" aria-label="Refresh">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left min-w-[860px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            {["Customer", eventId ? "Booked" : "Event", "Guests", "Amount", "Status", "Actions"].map(h => (
                                <th key={h} className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && rows.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Loading reservations…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" /> No reservations found
                            </td></tr>
                        ) : filtered.map(r => {
                            const st = RESERVATION_STATUS[r.status] ?? RESERVATION_STATUS.PENDING;
                            const pay = PAYMENT_STATUS[r.payment_status] ?? PAYMENT_STATUS.PENDING;
                            const cancelled = !ACTIVE(r);
                            return (
                                <tr key={r.id} className={`hover:bg-slate-50 align-top ${cancelled ? "opacity-60" : ""}`}>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-900">{r.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1"><Mail size={11} /> {r.email}</div>
                                        {r.phone && <a href={`tel:${r.phone}`} className="text-xs text-blue-600 flex items-center gap-1"><Phone size={11} /> {r.phone}</a>}
                                        <div className="text-[11px] text-slate-400 mt-0.5">Ref {r.booking_reference}</div>
                                        {r.special_requirements && <div className="text-xs text-amber-700 mt-1">Needs: {r.special_requirements}</div>}
                                        {r.notes && <div className="text-xs text-slate-600 mt-1 italic">Note: {r.notes}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                        {eventId ? (
                                            <span className="text-slate-500">{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                                        ) : (
                                            <Link href={`/admin/events/${r.event}`} className="hover:text-blue-600">
                                                <div className="font-semibold">{r.event_title}</div>
                                                <div className="text-xs text-slate-500">{longDate(r.event_date)} · {shortTime(r.event_start_time)}</div>
                                            </Link>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                        {r.num_children} child{r.num_children === 1 ? "" : "ren"}<br />{r.num_adults} adult{r.num_adults === 1 ? "" : "s"}
                                    </td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                        <div className="font-bold text-slate-900">{money(r.subtotal)}</div>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${pay.badge}`}>{pay.label}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${st.badge}`}>{st.label}</span>
                                        {r.arrived && <div className="text-[11px] text-emerald-600 font-bold mt-1">✓ Arrived</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap justify-end gap-1.5">
                                            {!cancelled && r.payment_status !== "FULLY_PAID" && (
                                                <button disabled={busy === r.id} onClick={() => act(r, "mark-paid")}
                                                    className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50">Mark paid</button>
                                            )}
                                            {!cancelled && r.payment_status === "FULLY_PAID" && (
                                                <button disabled={busy === r.id} onClick={() => act(r, "mark-unpaid", "Mark this reservation as not paid?")}
                                                    className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold">Undo paid</button>
                                            )}
                                            {!cancelled && !r.arrived && (
                                                <button disabled={busy === r.id} onClick={() => act(r, "mark-arrived")}
                                                    className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50">Arrived</button>
                                            )}
                                            {!cancelled && !r.arrived && r.status !== "NO_SHOW" && (
                                                <button disabled={busy === r.id} onClick={() => act(r, "mark-no-show", "Mark as a no-show?")}
                                                    className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold">No-show</button>
                                            )}
                                            {cancelled ? (
                                                <button disabled={busy === r.id} onClick={() => act(r, "reinstate")}
                                                    className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold">Reinstate</button>
                                            ) : (
                                                <button disabled={busy === r.id} onClick={() => act(r, "cancel", `Cancel ${r.name}'s reservation? Their places will be released.`)}
                                                    className="px-2.5 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold">Cancel</button>
                                            )}
                                            <button onClick={() => saveNotes(r)} className="p-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Notes" title="Notes">
                                                <StickyNote size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
