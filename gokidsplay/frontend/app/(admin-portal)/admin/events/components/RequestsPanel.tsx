"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, RefreshCw, Phone, Mail, CalendarDays, Users, Inbox, Trash2, Save, PlusCircle } from "lucide-react";
import { REQUEST_STATUS, longDate, typeInfo } from "./eventMeta";

interface EventRequest {
    id: number;
    reference: string;
    name: string;
    email: string;
    phone: string;
    event_type: string;
    event_type_display: string;
    preferred_date: string;
    alternative_date: string | null;
    preferred_time: string;
    num_children: number;
    num_adults: number;
    budget: string;
    details: string;
    status: string;
    admin_notes: string;
    event: number | null;
    event_title: string | null;
    created_at: string;
}

const OPEN = ["NEW", "CONTACTED", "QUOTED"];

/** Customers' requests for Go Kids Play to organise an event for them. */
export function RequestsPanel({ onCountChange }: { onCountChange?: (newCount: number) => void }) {
    const [rows, setRows] = useState<EventRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("open");
    const [notes, setNotes] = useState<Record<number, string>>({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/event-requests", { credentials: "include", cache: "no-store" });
            if (!res.ok) throw new Error();
            const data = await res.json();
            const list: EventRequest[] = Array.isArray(data) ? data : data.results ?? [];
            setRows(list);
            setNotes(Object.fromEntries(list.map(r => [r.id, r.admin_notes || ""])));
        } catch {
            toast.error("Could not load event requests");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { onCountChange?.(rows.filter(r => r.status === "NEW").length); }, [rows, onCountChange]);

    const update = async (r: EventRequest, changes: Partial<EventRequest>, okText: string) => {
        const res = await fetch(`/api/event-requests?id=${r.id}`, {
            method: "PATCH", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(changes),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { toast.error(data.error || "Could not update the request"); return; }
        setRows(list => list.map(x => (x.id === r.id ? { ...x, ...data } : x)));
        toast.success(okText);
    };

    const remove = async (r: EventRequest) => {
        if (!confirm(`Delete request ${r.reference} from ${r.name}? This can't be undone.`)) return;
        const res = await fetch(`/api/event-requests?id=${r.id}`, { method: "DELETE", credentials: "include" });
        if (res.ok) { setRows(list => list.filter(x => x.id !== r.id)); toast.success("Request deleted"); }
        else toast.error("Could not delete the request");
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter(r => {
            if (statusFilter === "open" && !OPEN.includes(r.status)) return false;
            if (statusFilter && statusFilter !== "open" && r.status !== statusFilter) return false;
            if (q && ![r.name, r.email, r.phone, r.reference, r.details].some(v => (v || "").toLowerCase().includes(q))) return false;
            return true;
        });
    }, [rows, search, statusFilter]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {["NEW", "CONTACTED", "QUOTED", "CONFIRMED"].map(k => (
                    <div key={k} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="text-2xl font-bold text-slate-900">{rows.filter(r => r.status === k).length}</div>
                        <div className="text-xs text-slate-500 mt-1">{REQUEST_STATUS[k].label}</div>
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
                    <option value="open">Open requests</option>
                    <option value="">All requests</option>
                    {Object.entries(REQUEST_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button onClick={load} className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50" aria-label="Refresh">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {loading && rows.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">Loading requests…</div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" /> No event requests
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(r => {
                        const st = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.NEW;
                        const type = typeInfo(r.event_type);
                        const prefill = new URLSearchParams({
                            from_request: String(r.id), event_type: r.event_type, date: r.preferred_date,
                            title: `${type.label} for ${r.name.split(" ")[0]}`,
                        });
                        return (
                            <article key={r.id} className={`bg-white rounded-xl border shadow-sm ${r.status === "NEW" ? "border-blue-300" : "border-slate-200"}`}>
                                <div className="p-5 flex flex-col lg:flex-row gap-5">
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xl">{type.emoji}</span>
                                            <h3 className="font-bold text-slate-900">{r.event_type_display}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${st.badge}`}>{st.label}</span>
                                            <span className="text-xs text-slate-400">Ref {r.reference} · received {new Date(r.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
                                            <span className="font-semibold">{r.name}</span>
                                            <a href={`tel:${r.phone}`} className="text-blue-600 flex items-center gap-1"><Phone size={13} /> {r.phone}</a>
                                            <a href={`mailto:${r.email}`} className="text-blue-600 flex items-center gap-1"><Mail size={13} /> {r.email}</a>
                                        </div>
                                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                                            <span className="flex items-center gap-1"><CalendarDays size={13} /> {longDate(r.preferred_date)}{r.alternative_date ? ` (or ${longDate(r.alternative_date)})` : ""}{r.preferred_time ? ` · ${r.preferred_time}` : ""}</span>
                                            <span className="flex items-center gap-1"><Users size={13} /> {r.num_children} children, {r.num_adults} adults</span>
                                            {r.budget && <span>Budget: {r.budget}</span>}
                                        </div>
                                        <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-lg p-3">{r.details}</p>
                                        {r.event_title && (
                                            <Link href={`/admin/events/${r.event}`} className="text-sm text-blue-600 font-semibold">Linked event: {r.event_title}</Link>
                                        )}
                                    </div>

                                    <div className="lg:w-72 space-y-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Status</label>
                                        <select value={r.status} onChange={e => update(r, { status: e.target.value }, "Status updated")}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700">
                                            {Object.entries(REQUEST_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                        </select>
                                        <label className="block text-xs font-bold text-slate-500 uppercase pt-1">Notes</label>
                                        <textarea rows={3} value={notes[r.id] ?? ""} onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))}
                                            placeholder="Calls, quotes, decisions…" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => update(r, { admin_notes: notes[r.id] ?? "" }, "Notes saved")}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold">
                                                <Save size={13} /> Save notes
                                            </button>
                                            <Link href={`/admin/events/new?${prefill}`}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                                                <PlusCircle size={13} /> Create event
                                            </Link>
                                            <button onClick={() => remove(r)} className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50" aria-label="Delete request">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
