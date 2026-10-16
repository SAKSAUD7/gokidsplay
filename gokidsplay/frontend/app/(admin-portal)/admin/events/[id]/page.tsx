"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Edit2, Globe, XCircle, ExternalLink, Calendar, Clock, Users, Copy, Loader2 } from "lucide-react";
import { EVENT_STATUS, longDate, money, shortTime } from "../components/eventMeta";
import { ReservationsTable } from "../components/ReservationsTable";

export default function EventDetailPage({ params }: { params: { id: string } }) {
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/events?id=${params.id}`, { credentials: "include", cache: "no-store" });
            if (res.ok) setEvent(await res.json());
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => { load(); }, [load]);

    async function doAction(action: "publish" | "cancel" | "duplicate") {
        let body: string | undefined;
        if (action === "cancel" && !confirm("Cancel this event? Customers with reservations will need to be contacted.")) return;
        if (action === "duplicate") {
            const date = prompt("Date for the copy (YYYY-MM-DD)", event.date);
            if (!date) return;
            body = JSON.stringify({ date });
        }
        const res = await fetch(`/api/events?id=${params.id}&action=${action}`, {
            method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { toast.error("Action failed"); return; }
        if (action === "duplicate" && data.id) {
            toast.success("Copy created as a draft");
            window.location.href = `/admin/events/${data.id}/edit`;
            return;
        }
        toast.success(action === "publish" ? "Event published" : "Event cancelled");
        load();
    }

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (!event) {
        return (
            <div className="p-8 text-slate-600">
                Event not found. <Link href="/admin/events" className="text-blue-600 font-semibold">Back to events</Link>
            </div>
        );
    }

    const st = EVENT_STATUS[event.status] ?? EVENT_STATUS.DRAFT;
    const taken = event.confirmed_booking_count || 0;
    const pct = Math.min(100, Math.round((taken / (event.total_capacity || 1)) * 100));

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-wrap items-start gap-4">
                <Link href="/admin/events" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 mt-1"><ArrowLeft size={20} /></Link>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-4xl">{event.emoji}</span>
                        <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${st.badge}`}>{st.label}</span>
                        {!event.is_public && <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Not on website</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-slate-600 mt-2 text-sm">
                        <span className="flex items-center gap-1"><Calendar size={15} /> {longDate(event.date)}</span>
                        <span className="flex items-center gap-1"><Clock size={15} /> {shortTime(event.start_time)} – {shortTime(event.end_time)}</span>
                        <span>{event.is_free ? "Free" : `Child ${money(event.price_per_child)} · Adult ${money(event.price_per_adult)}`}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {event.status === "PUBLISHED" && event.is_public && (
                        <a href={`/events/${event.slug}`} target="_blank" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold">
                            <ExternalLink size={15} /> View on site
                        </a>
                    )}
                    <button onClick={() => doAction("duplicate")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold">
                        <Copy size={15} /> Duplicate
                    </button>
                    <Link href={`/admin/events/${event.id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold">
                        <Edit2 size={15} /> Edit
                    </Link>
                    {event.status === "DRAFT" && (
                        <button onClick={() => doAction("publish")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold">
                            <Globe size={15} /> Publish
                        </button>
                    )}
                    {event.status === "PUBLISHED" && (
                        <button onClick={() => doAction("cancel")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold">
                            <XCircle size={15} /> Cancel event
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 flex items-center gap-1.5"><Users size={15} /> {taken} of {event.total_capacity} places reserved{event.reserved_spots ? ` (${event.reserved_spots} held back)` : ""}</span>
                    <span className={`font-bold ${event.available_spots > 0 ? "text-emerald-600" : "text-red-600"}`}>{event.available_spots > 0 ? `${event.available_spots} places left` : "Full"}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                    <div className={`h-2.5 rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">Reservations</h2>
                <ReservationsTable eventId={event.id} onChange={load} />
            </div>
        </div>
    );
}
