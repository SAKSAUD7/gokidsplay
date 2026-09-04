"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
    Calendar, Clock, Users, Plus, Edit2, Eye, Globe,
    RefreshCw, Search, CheckCircle, XCircle, AlertCircle,
    Zap, EyeOff
} from "lucide-react";

export const dynamic = "force-dynamic";

interface SpecialEvent {
    id: number;
    uuid: string;
    event_type: string;
    event_type_display: string;
    title: string;
    slug: string;
    short_description: string;
    status: string;
    status_display: string;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    DRAFT:     { label: "Draft",     color: "#9CA3AF", bg: "rgba(156,163,175,0.12)", icon: AlertCircle },
    PUBLISHED: { label: "Published", color: "#10B981", bg: "rgba(16,185,129,0.12)",  icon: CheckCircle },
    CANCELLED: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.12)",   icon: XCircle },
    COMPLETED: { label: "Completed", color: "#6366F1", bg: "rgba(99,102,241,0.12)",  icon: CheckCircle },
    SOLD_OUT:  { label: "Sold Out",  color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  icon: Zap },
};

const EVENT_TYPES = [
    { value: "", label: "All Types" },
    { value: "BIRTHDAY",      label: "🎂 Birthday" },
    { value: "CHRISTMAS",     label: "🎄 Christmas" },
    { value: "PAJAMA",        label: "🌙 Pajama Party" },
    { value: "HALLOWEEN",     label: "🎃 Halloween" },
    { value: "EASTER",        label: "🐣 Easter" },
    { value: "SCHOOL_HOLIDAY",label: "📚 School Holiday" },
    { value: "SUMMER",        label: "☀️ Summer" },
    { value: "SPECIAL",       label: "✨ Special" },
    { value: "CUSTOM",        label: "🎯 Custom" },
];

export default function AdminEventsPage() {
    const [events, setEvents]     = useState<SpecialEvent[]>([]);
    const [filtered, setFiltered] = useState<SpecialEvent[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter]     = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/events", { credentials: "include", cache: "no-store" });
            if (!res.ok) throw new Error("Failed to load events");
            const data = await res.json();
            const arr = Array.isArray(data) ? data : (data.results ?? []);
            setEvents(arr);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        let r = [...events];
        if (search) { const q = search.toLowerCase(); r = r.filter(e => e.title.toLowerCase().includes(q)); }
        if (statusFilter) r = r.filter(e => e.status === statusFilter);
        if (typeFilter)   r = r.filter(e => e.event_type === typeFilter);
        setFiltered(r);
    }, [search, statusFilter, typeFilter, events]);

    async function doAction(id: number, action: "publish" | "cancel") {
        if (action === "cancel" && !confirm("Cancel this event? All pending bookings will need manual review.")) return;
        const res = await fetch(`/api/events?id=${id}&action=${action}`, { method: "POST", credentials: "include" });
        if (res.ok) { toast.success(action === "publish" ? "Event published!" : "Event cancelled"); load(); }
        else toast.error("Action failed");
    }

    const stats = {
        total: events.length,
        published: events.filter(e => e.status === "PUBLISHED").length,
        upcoming: events.filter(e => e.status === "PUBLISHED" && new Date(e.date) >= new Date()).length,
        draft: events.filter(e => e.status === "DRAFT").length,
    };

    return (
        <div style={{ minHeight: "100vh", background: "#0F0F1A", padding: "2rem", fontFamily: "Inter, sans-serif", color: "#fff" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #8B5CF6, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎉</div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>Special Events</h1>
                    </div>
                    <p style={{ color: "#6B7280", margin: 0, fontSize: "0.9rem" }}>Manage all Go Kids Play special events — Birthday, Christmas, Halloween and more</p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button onClick={load} style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <Link href="/admin/events/new">
                        <button style={{ padding: "0.6rem 1.25rem", borderRadius: 8, background: "linear-gradient(135deg, #8B5CF6, #EC4899)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Plus size={16} /> Create Event
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                {[
                    { label: "Total Events",    value: stats.total,     emoji: "🗓️",  color: "#8B5CF6" },
                    { label: "Published",       value: stats.published, emoji: "🟢",  color: "#10B981" },
                    { label: "Upcoming",        value: stats.upcoming,  emoji: "⏰",  color: "#06B6D4" },
                    { label: "Draft",           value: stats.draft,     emoji: "📝",  color: "#F59E0B" },
                ].map(s => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: 22 }}>{s.emoji}</span>
                        <div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: "0.7rem", color: "#6B7280", marginTop: 2 }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#4B5563" }} />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…"
                        style={{ width: "100%", paddingLeft: "2.1rem", padding: "0.6rem 0.75rem 0.6rem 2.1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "0.85rem", boxSizing: "border-box", outline: "none" }}
                    />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#1a1a2e", color: "#9CA3AF", fontSize: "0.85rem", cursor: "pointer" }}>
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#1a1a2e", color: "#9CA3AF", fontSize: "0.85rem", cursor: "pointer" }}>
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
            </div>

            {/* Event grid */}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                    {[1,2,3,4].map(i => (
                        <div key={i} style={{ height: 280, borderRadius: 16, background: "rgba(255,255,255,0.04)" }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#4B5563" }}>
                    <div style={{ fontSize: 60, marginBottom: "1rem" }}>🎉</div>
                    <h3 style={{ color: "#9CA3AF", fontWeight: 600, margin: "0 0 0.5rem" }}>No events found</h3>
                    <p style={{ margin: "0 0 1.5rem", fontSize: "0.9rem" }}>Create your first special event to get started</p>
                    <Link href="/admin/events/new">
                        <button style={{ padding: "0.75rem 2rem", borderRadius: 10, background: "linear-gradient(135deg, #8B5CF6, #EC4899)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 600 }}>+ Create Event</button>
                    </Link>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                    {filtered.map(ev => (
                        <EventCard key={ev.id} event={ev} onAction={doAction} />
                    ))}
                </div>
            )}
        </div>
    );
}

function EventCard({ event, onAction }: { event: SpecialEvent; onAction: (id: number, action: "publish" | "cancel") => void }) {
    const cfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.DRAFT;
    const StatusIcon = cfg.icon;
    const fillPct = Math.min(100, Math.round(((event.confirmed_booking_count || 0) / (event.total_capacity || 1)) * 100));

    return (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
             onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)"; }}
             onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
            <div style={{ height: 5, background: `linear-gradient(90deg, ${event.accent_color}, ${event.accent_color}88)` }} />
            <div style={{ padding: "1.25rem" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ fontSize: 26 }}>{event.emoji}</span>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{event.title}</h3>
                            <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{event.event_type_display}</span>
                        </div>
                    </div>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, padding: "0.22rem 0.55rem", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: "0.68rem", fontWeight: 600, border: `1px solid ${cfg.color}30`, whiteSpace: "nowrap" }}>
                        <StatusIcon size={10} /> {cfg.label}
                    </span>
                </div>

                {/* Date/time */}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.6rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#9CA3AF", fontSize: "0.78rem" }}>
                        <Calendar size={12} /> {new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#9CA3AF", fontSize: "0.78rem" }}>
                        <Clock size={12} /> {event.start_time?.slice(0,5)} – {event.end_time?.slice(0,5)}
                    </span>
                </div>

                {/* Capacity bar */}
                <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.72rem", color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}><Users size={11} /> {event.confirmed_booking_count} / {event.total_capacity}</span>
                        <span style={{ fontSize: "0.72rem", color: event.available_spots > 0 ? "#10B981" : "#EF4444", fontWeight: 600 }}>{event.available_spots > 0 ? `${event.available_spots} left` : "Sold Out"}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)" }}>
                        <div style={{ height: "100%", width: `${fillPct}%`, background: fillPct >= 90 ? "#EF4444" : fillPct >= 70 ? "#F59E0B" : "#10B981", borderRadius: 99 }} />
                    </div>
                </div>

                {/* Pricing */}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.9rem", alignItems: "center" }}>
                    {event.is_free ? (
                        <span style={{ color: "#10B981", fontWeight: 700, fontSize: "0.85rem" }}>FREE</span>
                    ) : (
                        <>
                            <span style={{ color: "#9CA3AF", fontSize: "0.78rem" }}>Child: <strong style={{ color: "#fff" }}>£{parseFloat(event.price_per_child).toFixed(2)}</strong></span>
                            <span style={{ color: "#9CA3AF", fontSize: "0.78rem" }}>Adult: <strong style={{ color: "#fff" }}>£{parseFloat(event.price_per_adult).toFixed(2)}</strong></span>
                        </>
                    )}
                    {!event.is_public && <span style={{ color: "#F59E0B", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 3 }}><EyeOff size={11} /> Hidden</span>}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link href={`/admin/events/${event.id}`} style={{ flex: 1, textDecoration: "none" }}>
                        <button style={{ width: "100%", padding: "0.45rem", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#D1D5DB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", fontSize: "0.78rem" }}>
                            <Eye size={13} /> View
                        </button>
                    </Link>
                    <Link href={`/admin/events/${event.id}/edit`} style={{ flex: 1, textDecoration: "none" }}>
                        <button style={{ width: "100%", padding: "0.45rem", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#D1D5DB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", fontSize: "0.78rem" }}>
                            <Edit2 size={13} /> Edit
                        </button>
                    </Link>
                    {event.status === "DRAFT" && (
                        <button onClick={() => onAction(event.id, "publish")} style={{ flex: 1, padding: "0.45rem", borderRadius: 7, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 600 }}>
                            <Globe size={13} /> Publish
                        </button>
                    )}
                    {event.status === "PUBLISHED" && (
                        <button onClick={() => onAction(event.id, "cancel")} style={{ padding: "0.45rem 0.7rem", borderRadius: 7, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#EF4444", cursor: "pointer", fontSize: "0.78rem" }}>
                            <XCircle size={13} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
