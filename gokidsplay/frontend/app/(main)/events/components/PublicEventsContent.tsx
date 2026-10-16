"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ChevronRight, Sparkles, Search, PartyPopper } from "lucide-react";
import { getMediaUrl } from "@/lib/media-utils";
import { todayInUK } from "@/lib/api/types";
import { RequestEventModal } from "./RequestEventModal";

const TYPE_FILTERS = [
    { value: "", label: "All Events" },
    { value: "BIRTHDAY",       label: "🎂 Birthday" },
    { value: "CHRISTMAS",      label: "🎄 Christmas" },
    { value: "PAJAMA",         label: "🌙 Pajama" },
    { value: "HALLOWEEN",      label: "🎃 Halloween" },
    { value: "EASTER",         label: "🐣 Easter" },
    { value: "SCHOOL_HOLIDAY", label: "📚 School Holiday" },
    { value: "SUMMER",         label: "☀️ Summer" },
    { value: "SPECIAL",        label: "✨ Special" },
];

interface Event {
    id: number;
    slug: string;
    event_type: string;
    event_type_display: string;
    title: string;
    short_description: string;
    date: string;
    start_time: string;
    end_time: string;
    total_capacity: number;
    available_spots: number;
    price_per_child: string;
    price_per_adult: string;
    is_free: boolean;
    is_sold_out: boolean;
    emoji: string;
    accent_color: string;
    cover_image: string | null;
    status: string;
}

export default function PublicEventsContent({
    events,
    content,
}: {
    events: Event[];
    /** Resolved "events" page content — see lib/cms/page-registry.ts */
    content: Record<string, Record<string, string> | null>;
}) {
    const { hero, empty } = content;
    const [typeFilter, setTypeFilter] = useState("");
    const [search, setSearch] = useState("");
    const [requestOpen, setRequestOpen] = useState(false);
    const today = todayInUK();

    const filtered = events.filter(e => {
        if (typeFilter && e.event_type !== typeFilter) return false;
        if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    // Compare dates as YYYY-MM-DD in UK time so events on today's date still count as upcoming
    const upcoming = filtered.filter(e => e.date >= today);
    const past     = filtered.filter(e => e.date < today);

    return (
        <main style={{ minHeight: "100vh", background: "#080812", color: "#fff", fontFamily: "Inter, sans-serif" }}>

            {/* Hero */}
            <div style={{
                background: "linear-gradient(135deg, #0F0F1A 0%, #1a0a2e 50%, #0F0F1A 100%)",
                padding: "5rem 2rem 4rem",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Decorative blobs */}
                <div style={{ position: "absolute", top: "20%", left: "15%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "10%", right: "20%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.15), transparent 70%)", pointerEvents: "none" }} />

                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: 99, border: "1px solid rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.1)", marginBottom: "1.25rem", fontSize: "0.8rem", color: "#A78BFA" }}>
                    <Sparkles size={13} /> {hero?.badge ?? "Special Events & Parties"}
                </div>
                <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, margin: "0 0 1rem", background: "linear-gradient(135deg, #fff 30%, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {hero?.title ?? "Go Kids Play Events"}
                </h1>
                <p style={{ fontSize: "1.15rem", color: "#9CA3AF", maxWidth: 600, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
                    {hero?.subtitle ?? "From Birthday parties to Halloween nights — create unforgettable memories at Go Kids Play Coventry."}
                </p>

                {/* Search */}
                <div style={{ position: "relative", maxWidth: 440, margin: "0 auto" }}>
                    <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6B7280" }} />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search events…"
                        style={{ width: "100%", padding: "0.8rem 1rem 0.8rem 2.75rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box", backdropFilter: "blur(10px)", outline: "none" }}
                    />
                </div>

                <button onClick={() => setRequestOpen(true)}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform">
                    <PartyPopper className="w-5 h-5" /> Request an Event
                </button>
                <p style={{ color: "#6B7280", fontSize: "0.8rem", marginTop: "0.6rem" }}>Want us to organise something special? Tell us and we&apos;ll plan it with you.</p>
            </div>

            {/* Type filters */}
            <div style={{ padding: "1.5rem 2rem 0", maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {TYPE_FILTERS.map(t => (
                        <button key={t.value} onClick={() => setTypeFilter(t.value)}
                            style={{ padding: "0.45rem 1rem", borderRadius: 99, border: `1px solid ${typeFilter === t.value ? "#8B5CF6" : "rgba(255,255,255,0.1)"}`, background: typeFilter === t.value ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)", color: typeFilter === t.value ? "#A78BFA" : "#9CA3AF", cursor: "pointer", fontSize: "0.82rem", fontWeight: typeFilter === t.value ? 700 : 400, transition: "all 0.15s" }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Events */}
            <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
                {upcoming.length === 0 && past.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "5rem 1rem", color: "#4B5563" }}>
                        <div style={{ fontSize: 64, marginBottom: "1rem" }}>🎉</div>
                        <h2 style={{ color: "#9CA3AF", fontWeight: 600, margin: "0 0 0.5rem" }}>{empty?.title ?? "No events found"}</h2>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>{empty?.subtitle ?? "Check back soon for upcoming events!"}</p>
                    </div>
                ) : (
                    <>
                        {upcoming.length > 0 && (
                            <>
                                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: "0 0 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    🗓️ Upcoming Events
                                    <span style={{ padding: "0.15rem 0.6rem", borderRadius: 99, background: "rgba(139,92,246,0.2)", color: "#A78BFA", fontSize: "0.75rem" }}>{upcoming.length}</span>
                                </h2>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
                                    {upcoming.map(ev => <EventCard key={ev.id} event={ev} />)}
                                </div>
                            </>
                        )}
                        {past.length > 0 && (
                            <>
                                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#6B7280", margin: "0 0 1rem" }}>Past Events</h2>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: "1rem", opacity: 0.6 }}>
                                    {past.map(ev => <EventCard key={ev.id} event={ev} />)}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Can't find the right event? */}
                <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-r from-pink-500/10 to-purple-600/10 p-8 text-center">
                    <h2 className="text-2xl font-black text-white">Planning something special?</h2>
                    <p className="text-white/60 mt-2 max-w-xl mx-auto">Birthdays, school trips, holiday parties or a private event, tell us what you&apos;d like and our team will organise it.</p>
                    <button onClick={() => setRequestOpen(true)}
                        className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:scale-105 transition-transform">
                        <PartyPopper className="w-5 h-5" /> Request an Event
                    </button>
                </div>
            </div>

            <RequestEventModal open={requestOpen} onClose={() => setRequestOpen(false)} />
        </main>
    );
}

function EventCard({ event }: { event: Event }) {
    const isPast = event.date < todayInUK();
    const childPrice = parseFloat(event.price_per_child) || 0;
    const adultPrice = parseFloat(event.price_per_adult) || 0;
    return (
        <Link href={`/events/${event.slug}`} style={{ textDecoration: "none" }}>
            <div style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20, overflow: "hidden", cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
            }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${event.accent_color}44`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
            >
                {/* Cover */}
                <div style={{ height: 180, background: event.cover_image ? `url(${getMediaUrl(event.cover_image)}) center/cover` : `linear-gradient(135deg, ${event.accent_color}44, ${event.accent_color}11)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {!event.cover_image && <span style={{ fontSize: 64, opacity: 0.8 }}>{event.emoji}</span>}
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                        {event.is_sold_out || isPast ? (
                            <span style={{ padding: "0.25rem 0.75rem", borderRadius: 99, background: "rgba(0,0,0,0.7)", color: "#EF4444", fontSize: "0.72rem", fontWeight: 700, backdropFilter: "blur(4px)" }}>
                                {isPast ? "Past Event" : "Sold Out"}
                            </span>
                        ) : (
                            <span style={{ padding: "0.25rem 0.75rem", borderRadius: 99, background: "rgba(16,185,129,0.2)", color: "#10B981", fontSize: "0.72rem", fontWeight: 700, backdropFilter: "blur(4px)", border: "1px solid rgba(16,185,129,0.3)" }}>
                                {event.available_spots} places left
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ padding: "1.25rem" }}>
                    <span style={{ fontSize: "0.72rem", color: event.accent_color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{event.event_type_display}</span>
                    <h3 style={{ margin: "0.35rem 0 0.6rem", fontSize: "1.1rem", fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{event.title}</h3>
                    {event.short_description && <p style={{ margin: "0 0 0.9rem", fontSize: "0.85rem", color: "#9CA3AF", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{event.short_description}</p>}

                    <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6B7280", fontSize: "0.8rem" }}>
                            <Calendar size={13} style={{ color: event.accent_color }} />
                            {new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6B7280", fontSize: "0.8rem" }}>
                            <Clock size={13} style={{ color: event.accent_color }} />
                            {event.start_time?.slice(0,5)}
                        </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 700 }}>
                            {event.is_free || (childPrice === 0 && adultPrice === 0) ? <span style={{ color: "#10B981" }}>Free Entry</span>
                                : childPrice > 0 ? `£${childPrice.toFixed(2)} per child` : `£${adultPrice.toFixed(2)} per adult`}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: event.accent_color, fontSize: "0.82rem", fontWeight: 600 }}>
                            Reserve <ChevronRight size={14} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
