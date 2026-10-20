"use client";

import { useUrlSearch } from "@/lib/hooks/use-url-search";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, RefreshCw, Search, Calendar, Clock, Users, Eye, Edit2, Globe, XCircle, EyeOff, ClipboardList } from "lucide-react";
import { EVENT_STATUS, EVENT_TYPES, longDate, money, shortTime, todayUK, typeInfo } from "./components/eventMeta";

interface SpecialEvent {
    id: number;
    event_type: string;
    event_type_display: string;
    title: string;
    status: string;
    date: string;
    start_time: string;
    end_time: string;
    total_capacity: number;
    available_spots: number;
    confirmed_booking_count: number;
    price_per_child: string;
    price_per_adult: string;
    is_free: boolean;
    is_public: boolean;
    emoji: string;
    accent_color: string;
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<SpecialEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useUrlSearch();
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [when, setWhen] = useState<"upcoming" | "past" | "all">("upcoming");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/events", { credentials: "include", cache: "no-store" });
            if (!res.ok) throw new Error("Could not load events");
            const data = await res.json();
            setEvents(Array.isArray(data) ? data : data.results ?? []);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const today = todayUK();
    const filtered = useMemo(() => events.filter(e => {
        if (when === "upcoming" && e.date < today) return false;
        if (when === "past" && e.date >= today) return false;
        if (statusFilter && e.status !== statusFilter) return false;
        if (typeFilter && e.event_type !== typeFilter) return false;
        if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }), [events, when, statusFilter, typeFilter, search, today]);

    async function doAction(ev: SpecialEvent, action: "publish" | "cancel") {
        let reason = "";
        if (action === "cancel") {
            const answer = prompt(`Cancel "${ev.title}"?\n\nEvery reservation is cancelled and each customer gets an e-mail.\nReason to tell customers (optional):`, "");
            if (answer === null) return;   // pressed Cancel
            reason = answer.trim();
        }
        const res = await fetch(`/api/events?id=${ev.id}&action=${action}`, {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(action === "cancel" ? { reason } : {}),
        });
        if (!res.ok) { toast.error("Action failed"); return; }
        if (action === "publish") toast.success("Event published");
        else {
            const r = await res.json().catch(() => ({}));
            const n = Number(r.bookings_cancelled || 0);
            toast.success(n ? `Event cancelled · ${n} reservation${n === 1 ? "" : "s"} cancelled, ${r.customers_emailed ?? 0} customer${r.customers_emailed === 1 ? "" : "s"} e-mailed`
                : "Event cancelled (no reservations)");
            if (Number(r.bookings_to_refund) > 0) toast.warning(`${r.bookings_to_refund} reservation(s) had paid: refund them from Payments.`);
        }
        load();
    }

    const stats = [
        { label: "Upcoming", value: events.filter(e => e.date >= today && e.status === "PUBLISHED").length },
        { label: "Drafts", value: events.filter(e => e.status === "DRAFT").length },
        { label: "Places reserved", value: events.filter(e => e.date >= today).reduce((s, e) => s + (e.confirmed_booking_count || 0), 0) },
        { label: "Total events", value: events.length },
    ];

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Special Events</h1>
                    <p className="text-slate-500 mt-1">Halloween, Christmas, holiday specials and more. Customers reserve online and pay at the venue.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/admin/events/reservations" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-sm">
                        <ClipboardList size={18} /> Reservations & Requests
                    </Link>
                    <Link href="/admin/events/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm">
                        <Plus size={18} /> Create Event
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                        <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden text-sm">
                    {(["upcoming", "past", "all"] as const).map(w => (
                        <button key={w} onClick={() => setWhen(w)}
                            className={`px-3 py-2 font-semibold capitalize ${when === w ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{w}</button>
                    ))}
                </div>
                <div className="relative flex-1 min-w-[180px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700">
                    <option value="">All statuses</option>
                    {Object.entries(EVENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700">
                    <option value="">All types</option>
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                </select>
                <button onClick={load} className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50" aria-label="Refresh">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {loading && events.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-56 rounded-xl bg-slate-100 animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="text-5xl mb-3">🎉</div>
                    <h3 className="font-bold text-slate-800">No events found</h3>
                    <p className="text-slate-500 text-sm mt-1 mb-4">Create an event and publish it to show it on the website.</p>
                    <Link href="/admin/events/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm">
                        <Plus size={16} /> Create Event
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(ev => <EventCard key={ev.id} event={ev} onAction={doAction} />)}
                </div>
            )}
        </div>
    );
}

function EventCard({ event, onAction }: { event: SpecialEvent; onAction: (ev: SpecialEvent, action: "publish" | "cancel") => void }) {
    const st = EVENT_STATUS[event.status] ?? EVENT_STATUS.DRAFT;
    const taken = event.confirmed_booking_count || 0;
    const pct = Math.min(100, Math.round((taken / (event.total_capacity || 1)) * 100));
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="h-1.5" style={{ background: event.accent_color || typeInfo(event.event_type).color }} />
            <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl">{event.emoji}</span>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 leading-tight truncate">{event.title}</h3>
                            <p className="text-xs text-slate-500">{event.event_type_display}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${st.badge}`}>{st.label}</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {longDate(event.date)}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {shortTime(event.start_time)} – {shortTime(event.end_time)}</span>
                </div>

                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 flex items-center gap-1"><Users size={12} /> {taken} / {event.total_capacity} reserved</span>
                        <span className={`font-bold ${event.available_spots > 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {event.available_spots > 0 ? `${event.available_spots} left` : "Full"}
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                    {event.is_free ? <span className="font-bold text-emerald-600">Free</span> : (
                        <>
                            <span className="text-slate-500">Child <strong className="text-slate-900">{money(event.price_per_child)}</strong></span>
                            <span className="text-slate-500">Adult <strong className="text-slate-900">{money(event.price_per_adult)}</strong></span>
                        </>
                    )}
                    {!event.is_public && <span className="text-amber-600 text-xs font-semibold flex items-center gap-1"><EyeOff size={12} /> Not on website</span>}
                </div>

                <div className="flex gap-2 mt-auto pt-1">
                    <Link href={`/admin/events/${event.id}`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold">
                        <Eye size={15} /> Reservations
                    </Link>
                    <Link href={`/admin/events/${event.id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold">
                        <Edit2 size={15} /> Edit
                    </Link>
                    {event.status === "DRAFT" && (
                        <button onClick={() => onAction(event, "publish")} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold">
                            <Globe size={15} /> Publish
                        </button>
                    )}
                    {event.status === "PUBLISHED" && (
                        <button onClick={() => onAction(event, "cancel")} className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50" aria-label="Cancel event" title="Cancel event">
                            <XCircle size={15} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
