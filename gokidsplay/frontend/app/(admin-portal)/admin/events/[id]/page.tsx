"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    ArrowLeft, Edit2, Users, Calendar, Clock, Pound, CheckCircle,
    XCircle, Globe, RefreshCw, Eye, EyeOff, Copy, Trash2, AlertCircle,
    TrendingUp
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
    DRAFT: "#9CA3AF", PUBLISHED: "#10B981", CANCELLED: "#EF4444",
    COMPLETED: "#6366F1", SOLD_OUT: "#F59E0B",
};

const BOOKING_STATUS_COLOR: Record<string, string> = {
    PENDING: "#F59E0B", CONFIRMED: "#10B981", CANCELLED: "#EF4444",
    COMPLETED: "#6366F1", NO_SHOW: "#9CA3AF", REFUNDED: "#EC4899",
};

export default function EventDetailPage({ params }: { params: { id: string } }) {
    const [event, setEvent]     = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [stats, setStats]     = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing]   = useState(false);
    const router = useRouter();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [eRes, bRes, sRes] = await Promise.all([
                fetch(`/api/events?id=${params.id}`, { credentials: "include", cache: "no-store" }),
                fetch(`/api/event-bookings?event_id=${params.id}`, { credentials: "include", cache: "no-store" }),
                fetch(`/api/events?id=${params.id}&sub=stats`, { credentials: "include", cache: "no-store" }),
            ]);
            if (eRes.ok) setEvent(await eRes.json());
            if (bRes.ok) { const bd = await bRes.json(); setBookings(Array.isArray(bd) ? bd : (bd.results ?? [])); }
            if (sRes.ok) setStats(await sRes.json());
        } catch (e) { toast.error("Failed to load event"); }
        finally { setLoading(false); }
    }, [params.id]);

    useEffect(() => { load(); }, [load]);

    async function doAction(action: "publish" | "cancel") {
        if (action === "cancel" && !confirm("Cancel this event? This cannot be undone.")) return;
        setActing(true);
        const res = await fetch(`/api/events?id=${params.id}&action=${action}`, { method: "POST", credentials: "include" });
        if (res.ok) { toast.success(action === "publish" ? "Event published!" : "Event cancelled"); load(); }
        else toast.error("Action failed");
        setActing(false);
    }

    async function confirmBooking(bookingId: number) {
        const res = await fetch(`/api/event-bookings?id=${bookingId}&action=confirm`, { method: "POST", credentials: "include" });
        if (res.ok) { toast.success("Booking confirmed"); load(); }
        else toast.error("Failed to confirm");
    }

    async function cancelBooking(bookingId: number) {
        if (!confirm("Cancel this booking?")) return;
        const res = await fetch(`/api/event-bookings?id=${bookingId}&action=cancel`, { method: "POST", credentials: "include" });
        if (res.ok) { toast.success("Booking cancelled"); load(); }
        else toast.error("Failed to cancel");
    }

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "#0F0F1A", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
                Loading event…
            </div>
        );
    }

    if (!event) {
        return (
            <div style={{ minHeight: "100vh", background: "#0F0F1A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
                <div style={{ fontSize: 48 }}>❌</div>
                <p>Event not found</p>
                <Link href="/admin/events"><button style={{ padding: "0.6rem 1.25rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#D1D5DB", cursor: "pointer" }}>Back to Events</button></Link>
            </div>
        );
    }

    const fillPct = Math.min(100, Math.round(((event.confirmed_booking_count || 0) / (event.total_capacity || 1)) * 100));
    const statusColor = STATUS_COLOR[event.status] || "#9CA3AF";

    return (
        <div style={{ minHeight: "100vh", background: "#0F0F1A", padding: "2rem", fontFamily: "Inter, sans-serif", color: "#fff" }}>

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <Link href="/admin/events" style={{ color: "#6B7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                    <ArrowLeft size={16} /> Events
                </Link>
                <span style={{ color: "#374151" }}>/</span>
                <span style={{ color: "#D1D5DB", fontWeight: 600 }}>{event.title}</span>
            </div>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: `${event.accent_color}22`, border: `2px solid ${event.accent_color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                        {event.emoji}
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>{event.title}</h1>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: 4 }}>
                            <span style={{ fontSize: "0.8rem", color: "#6B7280" }}>{event.event_type_display}</span>
                            <span style={{ padding: "0.2rem 0.6rem", borderRadius: 20, background: `${statusColor}18`, color: statusColor, fontSize: "0.72rem", fontWeight: 700, border: `1px solid ${statusColor}30` }}>{event.status_display}</span>
                            {!event.is_public && <span style={{ color: "#F59E0B", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 3 }}><EyeOff size={11} /> Hidden</span>}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button onClick={load} style={{ padding: "0.55rem 0.9rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#9CA3AF", cursor: "pointer" }}>
                        <RefreshCw size={14} />
                    </button>
                    <Link href={`/admin/events/${params.id}/edit`}>
                        <button style={{ padding: "0.55rem 1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#D1D5DB", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                            <Edit2 size={13} /> Edit
                        </button>
                    </Link>
                    {event.status === "DRAFT" && (
                        <button onClick={() => doAction("publish")} disabled={acting} style={{ padding: "0.55rem 1rem", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <Globe size={13} /> Publish
                        </button>
                    )}
                    {event.status === "PUBLISHED" && (
                        <button onClick={() => doAction("cancel")} disabled={acting} style={{ padding: "0.55rem 1rem", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#EF4444", cursor: "pointer", fontSize: "0.85rem" }}>
                            Cancel Event
                        </button>
                    )}
                </div>
            </div>

            {/* Accent bar */}
            <div style={{ height: 3, borderRadius: 99, background: `linear-gradient(90deg, ${event.accent_color}, transparent)`, marginBottom: "1.5rem" }} />

            {/* Stats row */}
            {stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    {[
                        { label: "Total Capacity", value: stats.total_capacity, color: "#8B5CF6" },
                        { label: "Available", value: stats.available_spots, color: stats.available_spots > 0 ? "#10B981" : "#EF4444" },
                        { label: "Confirmed", value: stats.confirmed_bookings, color: "#10B981" },
                        { label: "Pending", value: stats.pending_bookings, color: "#F59E0B" },
                        { label: "Revenue", value: `£${(stats.total_revenue_gbp || 0).toFixed(2)}`, color: "#06B6D4" },
                    ].map(s => (
                        <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1rem 1.1rem" }}>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: "0.7rem", color: "#6B7280", marginTop: 2 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Capacity bar */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>Capacity Fill</span>
                    <span style={{ fontSize: "0.8rem", color: "#fff", fontWeight: 600 }}>{fillPct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.1)" }}>
                    <div style={{ height: "100%", width: `${fillPct}%`, background: fillPct >= 90 ? "#EF4444" : fillPct >= 70 ? "#F59E0B" : "#10B981", borderRadius: 99, transition: "width 0.5s" }} />
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>
                {/* Event Info */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.25rem" }}>
                    <h3 style={{ margin: "0 0 1rem", fontSize: "0.9rem", fontWeight: 700, color: "#D1D5DB" }}>Event Info</h3>
                    {[
                        { label: "Date", value: new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
                        { label: "Time", value: `${event.start_time?.slice(0,5)} – ${event.end_time?.slice(0,5)}` },
                        { label: "Capacity", value: `${event.total_capacity} spots` },
                        { label: "Price (Child)", value: event.is_free ? "FREE" : `£${parseFloat(event.price_per_child).toFixed(2)}` },
                        { label: "Price (Adult)", value: event.is_free ? "FREE" : `£${parseFloat(event.price_per_adult).toFixed(2)}` },
                        { label: "Deposit", value: parseFloat(event.deposit_amount) > 0 ? `£${parseFloat(event.deposit_amount).toFixed(2)}` : "Full payment" },
                        { label: "Public", value: event.is_public ? "Yes" : "No" },
                        { label: "Slug", value: event.slug },
                    ].map(row => (
                        <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <span style={{ fontSize: "0.78rem", color: "#6B7280" }}>{row.label}</span>
                            <span style={{ fontSize: "0.78rem", color: "#D1D5DB", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{row.value}</span>
                        </div>
                    ))}
                    {event.short_description && (
                        <p style={{ margin: "0.75rem 0 0", fontSize: "0.8rem", color: "#9CA3AF", lineHeight: 1.5 }}>{event.short_description}</p>
                    )}
                </div>

                {/* Bookings list */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.25rem" }}>
                    <h3 style={{ margin: "0 0 1rem", fontSize: "0.9rem", fontWeight: 700, color: "#D1D5DB" }}>Bookings ({bookings.length})</h3>
                    {bookings.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "#4B5563" }}>
                            <Users size={32} style={{ marginBottom: "0.5rem", opacity: 0.4 }} />
                            <p style={{ margin: 0, fontSize: "0.85rem" }}>No bookings yet</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: 480, overflowY: "auto" }}>
                            {bookings.map(b => {
                                const bColor = BOOKING_STATUS_COLOR[b.status] || "#9CA3AF";
                                return (
                                    <div key={b.id} style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                                            <div style={{ fontSize: "0.72rem", color: "#6B7280" }}>{b.email} · {b.num_children}ch {b.num_adults}ad · £{parseFloat(b.subtotal).toFixed(2)}</div>
                                            <div style={{ fontSize: "0.68rem", color: "#4B5563", marginTop: 2 }}>Ref: {b.booking_reference}</div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                                            <span style={{ padding: "0.18rem 0.5rem", borderRadius: 20, background: `${bColor}18`, color: bColor, fontSize: "0.68rem", fontWeight: 700 }}>{b.status}</span>
                                            {b.status === "PENDING" && (
                                                <button onClick={() => confirmBooking(b.id)} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "none", background: "#10B981", color: "#fff", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}>Confirm</button>
                                            )}
                                            {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                                                <button onClick={() => cancelBooking(b.id)} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "none", color: "#EF4444", cursor: "pointer", fontSize: "0.7rem" }}>Cancel</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            {event.description && (
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.25rem", marginTop: "1.5rem" }}>
                    <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#D1D5DB" }}>Description</h3>
                    <p style={{ margin: 0, color: "#9CA3AF", fontSize: "0.875rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{event.description}</p>
                </div>
            )}
        </div>
    );
}
