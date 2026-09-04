"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Users, CheckCircle, ChevronRight, ArrowLeft, Minus, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Event {
    id: number;
    title: string;
    short_description: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    doors_open_time?: string;
    total_capacity: number;
    available_spots: number;
    price_per_child: string;
    price_per_adult: string;
    deposit_amount: string;
    is_free: boolean;
    is_sold_out: boolean;
    duration_minutes: number;
    emoji: string;
    accent_color: string;
    cover_image: string | null;
    event_type_display: string;
    terms_and_conditions: string;
    special_instructions: string;
    requires_age_verification: boolean;
    min_age?: number;
    max_age?: number;
}

type Step = "info" | "attendees" | "contact" | "confirm" | "done";

export default function EventDetailContent({ event }: { event: Event }) {
    const router = useRouter();
    const [step, setStep]             = useState<Step>("info");
    const [numChildren, setNumChildren] = useState(1);
    const [numAdults, setNumAdults]   = useState(1);
    const [name, setName]             = useState("");
    const [email, setEmail]           = useState("");
    const [phone, setPhone]           = useState("");
    const [requirements, setRequirements] = useState("");
    const [agreed, setAgreed]         = useState(false);
    const [booking, setBooking]       = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    const childPrice   = parseFloat(event.price_per_child) || 0;
    const adultPrice   = parseFloat(event.price_per_adult) || 0;
    const depositAmount = parseFloat(event.deposit_amount) || 0;
    const subtotal     = (numChildren * childPrice) + (numAdults * adultPrice);
    const depositDue   = depositAmount > 0 ? depositAmount : subtotal;
    const totalAttendees = numChildren + numAdults;
    const isPast       = new Date(event.date) < new Date();

    async function submitBooking() {
        if (!name || !email) { toast.error("Name and email are required"); return; }
        if (!agreed && event.terms_and_conditions) { toast.error("Please agree to the terms"); return; }
        if (totalAttendees > event.available_spots) { toast.error(`Only ${event.available_spots} spots available`); return; }
        setSubmitting(true);
        try {
            const res = await fetch("/api/event-bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: event.id,
                    name, email, phone,
                    num_children: numChildren,
                    num_adults: numAdults,
                    special_requirements: requirements,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Booking failed");
            setBooking(data);
            setStep("done");
        } catch (e: any) {
            toast.error(e.message || "Booking failed");
        } finally {
            setSubmitting(false);
        }
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "0.75rem 1rem", borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
        color: "#fff", fontSize: "0.95rem", boxSizing: "border-box", outline: "none",
    };

    // ── SUCCESS ──────────────────────────────────────────────────────────────
    if (step === "done" && booking) {
        return (
            <main style={{ minHeight: "100vh", background: "#080812", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Inter, sans-serif" }}>
                <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: 36 }}>✅</div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", margin: "0 0 0.5rem" }}>You're booked! {event.emoji}</h1>
                    <p style={{ color: "#9CA3AF", margin: "0 0 2rem", lineHeight: 1.6 }}>Your spot at <strong style={{ color: "#fff" }}>{event.title}</strong> is reserved.<br />We've saved your booking reference.</p>

                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1.5rem", marginBottom: "2rem", textAlign: "left" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            {[
                                { label: "Booking Ref", value: booking.booking_reference },
                                { label: "Event", value: event.title },
                                { label: "Date", value: new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) },
                                { label: "Time", value: event.start_time?.slice(0,5) },
                                { label: "Attendees", value: `${numChildren} child${numChildren !== 1 ? "ren" : ""}, ${numAdults} adult${numAdults !== 1 ? "s" : ""}` },
                                { label: event.is_free ? "Total" : "Deposit Due", value: event.is_free ? "FREE" : `£${depositDue.toFixed(2)}` },
                            ].map(row => (
                                <div key={row.label}>
                                    <div style={{ fontSize: "0.7rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{row.label}</div>
                                    <div style={{ fontSize: "0.875rem", color: "#fff", fontWeight: 600, marginTop: 2 }}>{row.value}</div>
                                </div>
                            ))}
                        </div>
                        {event.special_instructions && (
                            <div style={{ marginTop: "1.25rem", padding: "1rem", borderRadius: 10, background: `${event.accent_color}12`, border: `1px solid ${event.accent_color}33` }}>
                                <p style={{ margin: 0, fontSize: "0.85rem", color: "#D1D5DB", lineHeight: 1.6 }}><strong>Important:</strong> {event.special_instructions}</p>
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                        <Link href="/events"><button style={{ padding: "0.75rem 1.5rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "none", color: "#9CA3AF", cursor: "pointer" }}>View All Events</button></Link>
                        <Link href="/"><button style={{ padding: "0.75rem 1.5rem", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${event.accent_color}, ${event.accent_color}99)`, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Go Home</button></Link>
                    </div>
                </div>
            </main>
        );
    }

    // ── MAIN PAGE ─────────────────────────────────────────────────────────────
    return (
        <main style={{ minHeight: "100vh", background: "#080812", fontFamily: "Inter, sans-serif", color: "#fff" }}>

            {/* Hero */}
            <div style={{
                height: 320,
                background: event.cover_image
                    ? `linear-gradient(to bottom, rgba(8,8,18,0.2), rgba(8,8,18,0.9)), url(${event.cover_image}) center/cover`
                    : `linear-gradient(135deg, ${event.accent_color}33, #080812)`,
                display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end",
                padding: "2rem 2rem",
                position: "relative",
            }}>
                <Link href="/events" style={{ position: "absolute", top: "1.5rem", left: "1.5rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "0.85rem", background: "rgba(0,0,0,0.4)", padding: "0.4rem 0.9rem", borderRadius: 99, backdropFilter: "blur(4px)" }}>
                    <ArrowLeft size={14} /> Events
                </Link>
                <span style={{ fontSize: "0.75rem", color: event.accent_color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>{event.event_type_display}</span>
                <h1 style={{ margin: "0 0 0.75rem", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, lineHeight: 1.1 }}>
                    {event.emoji} {event.title}
                </h1>
                <div style={{ display: "flex", gap: "1.25rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#D1D5DB", fontSize: "0.875rem" }}>
                        <Calendar size={14} style={{ color: event.accent_color }} />
                        {new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#D1D5DB", fontSize: "0.875rem" }}>
                        <Clock size={14} style={{ color: event.accent_color }} />
                        {event.start_time?.slice(0,5)} – {event.end_time?.slice(0,5)}
                    </span>
                </div>
            </div>

            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem", alignItems: "start" }}>

                {/* Left: Event info */}
                <div>
                    {event.short_description && (
                        <p style={{ fontSize: "1.1rem", color: "#D1D5DB", lineHeight: 1.7, margin: "0 0 1.5rem", borderLeft: `3px solid ${event.accent_color}`, paddingLeft: "1rem" }}>{event.short_description}</p>
                    )}
                    {event.description && (
                        <div style={{ color: "#9CA3AF", lineHeight: 1.75, fontSize: "0.95rem", marginBottom: "2rem", whiteSpace: "pre-wrap" }}>{event.description}</div>
                    )}

                    {/* Event details grid */}
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
                        <h3 style={{ margin: "0 0 1rem", fontSize: "0.9rem", fontWeight: 700, color: "#D1D5DB" }}>Event Details</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            {[
                                { label: "Date", value: new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) },
                                { label: "Time", value: `${event.start_time?.slice(0,5)} – ${event.end_time?.slice(0,5)}` },
                                event.doors_open_time ? { label: "Doors Open", value: event.doors_open_time.slice(0,5) } : null,
                                { label: "Duration", value: `${event.duration_minutes} min` },
                                { label: "Available Spots", value: event.is_sold_out ? "Sold Out" : `${event.available_spots} remaining` },
                                { label: "Location", value: "Go Kids Play, Coventry" },
                            ].filter(Boolean).map((row: any) => (
                                <div key={row.label}>
                                    <div style={{ fontSize: "0.7rem", color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{row.label}</div>
                                    <div style={{ fontSize: "0.875rem", color: "#fff", fontWeight: 500 }}>{row.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Terms */}
                    {event.terms_and_conditions && (
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.25rem" }}>
                            <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#9CA3AF" }}>Terms & Conditions</h3>
                            <p style={{ margin: 0, fontSize: "0.8rem", color: "#4B5563", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{event.terms_and_conditions}</p>
                        </div>
                    )}
                </div>

                {/* Right: Booking widget */}
                <div style={{ position: "sticky", top: "2rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${event.accent_color}33`, borderRadius: 20, padding: "1.5rem", backdropFilter: "blur(12px)" }}>
                        <div style={{ height: 3, borderRadius: 99, background: `linear-gradient(90deg, ${event.accent_color}, transparent)`, marginBottom: "1.25rem" }} />

                        {isPast ? (
                            <div style={{ textAlign: "center", padding: "1rem", color: "#6B7280" }}>
                                <AlertCircle size={32} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.5 }} />
                                <p style={{ margin: 0, fontWeight: 600 }}>This event has passed</p>
                            </div>
                        ) : event.is_sold_out ? (
                            <div style={{ textAlign: "center", padding: "1rem", color: "#EF4444" }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>Sold Out</p>
                                <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "#6B7280" }}>No spots remaining for this event.</p>
                            </div>
                        ) : step === "info" ? (
                            <>
                                <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700 }}>Reserve Your Spots</h3>

                                {/* Pricing */}
                                <div style={{ marginBottom: "1.25rem" }}>
                                    {event.is_free ? (
                                        <div style={{ textAlign: "center", padding: "0.75rem", borderRadius: 10, background: "rgba(16,185,129,0.1)", color: "#10B981", fontWeight: 700 }}>FREE Event — No Charge</div>
                                    ) : (
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                            {childPrice > 0 && <span style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>Child: <strong style={{ color: "#fff" }}>£{childPrice.toFixed(2)}</strong></span>}
                                            {adultPrice > 0 && <span style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>Adult: <strong style={{ color: "#fff" }}>£{adultPrice.toFixed(2)}</strong></span>}
                                        </div>
                                    )}
                                </div>

                                {/* Counters */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                                    {childPrice > 0 && (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Children</div>
                                                <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>£{childPrice.toFixed(2)} each</div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                <button onClick={() => setNumChildren(Math.max(0, numChildren - 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={14} /></button>
                                                <span style={{ minWidth: 20, textAlign: "center", fontWeight: 700 }}>{numChildren}</span>
                                                <button onClick={() => setNumChildren(numChildren + 1)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: event.accent_color, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    )}
                                    {adultPrice > 0 && (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Adults</div>
                                                <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>£{adultPrice.toFixed(2)} each</div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                <button onClick={() => setNumAdults(Math.max(0, numAdults - 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={14} /></button>
                                                <span style={{ minWidth: 20, textAlign: "center", fontWeight: 700 }}>{numAdults}</span>
                                                <button onClick={() => setNumAdults(numAdults + 1)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: event.accent_color, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    )}
                                    {event.is_free && (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div><div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Total Attendees</div></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                <button onClick={() => { const t = Math.max(1, numChildren - 1); setNumChildren(t); }} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={14} /></button>
                                                <span style={{ minWidth: 20, textAlign: "center", fontWeight: 700 }}>{numChildren}</span>
                                                <button onClick={() => setNumChildren(numChildren + 1)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: event.accent_color, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Total */}
                                {!event.is_free && (
                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem", marginBottom: "1.25rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                            <span style={{ color: "#9CA3AF", fontSize: "0.85rem" }}>Subtotal</span>
                                            <span style={{ color: "#fff", fontWeight: 600 }}>£{subtotal.toFixed(2)}</span>
                                        </div>
                                        {depositAmount > 0 && depositAmount < subtotal && (
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#9CA3AF", fontSize: "0.85rem" }}>Deposit now</span>
                                                <span style={{ color: event.accent_color, fontWeight: 700 }}>£{depositDue.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => setStep("contact")}
                                    disabled={totalAttendees === 0}
                                    style={{ width: "100%", padding: "0.9rem", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${event.accent_color}, ${event.accent_color}cc)`, color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: totalAttendees === 0 ? "not-allowed" : "pointer", opacity: totalAttendees === 0 ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                    Reserve Now <ChevronRight size={16} />
                                </button>

                                <p style={{ textAlign: "center", margin: "0.75rem 0 0", fontSize: "0.72rem", color: "#4B5563" }}>
                                    {event.available_spots} spots remaining · No payment taken yet
                                </p>
                            </>
                        ) : step === "contact" ? (
                            <>
                                <button onClick={() => setStep("info")} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", color: "#6B7280", cursor: "pointer", marginBottom: "1rem", fontSize: "0.85rem" }}>
                                    <ArrowLeft size={14} /> Back
                                </button>
                                <h3 style={{ margin: "0 0 1.25rem", fontWeight: 700 }}>Your Details</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", color: "#9CA3AF", display: "block", marginBottom: "0.35rem" }}>Full Name *</label>
                                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", color: "#9CA3AF", display: "block", marginBottom: "0.35rem" }}>Email Address *</label>
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", color: "#9CA3AF", display: "block", marginBottom: "0.35rem" }}>Phone (optional)</label>
                                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44..." style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", color: "#9CA3AF", display: "block", marginBottom: "0.35rem" }}>Special Requirements</label>
                                        <textarea value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Allergies, accessibility needs, etc." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                                    </div>
                                    {event.terms_and_conditions && (
                                        <label style={{ display: "flex", gap: "0.6rem", cursor: "pointer", alignItems: "flex-start" }}>
                                            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3 }} />
                                            <span style={{ fontSize: "0.78rem", color: "#9CA3AF", lineHeight: 1.5 }}>I agree to the event terms and conditions</span>
                                        </label>
                                    )}
                                </div>
                                <button
                                    onClick={submitBooking} disabled={submitting}
                                    style={{ width: "100%", padding: "0.9rem", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${event.accent_color}, ${event.accent_color}cc)`, color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: submitting ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                    <CheckCircle size={16} /> {submitting ? "Booking…" : "Confirm Booking"}
                                </button>
                                <p style={{ textAlign: "center", margin: "0.75rem 0 0", fontSize: "0.72rem", color: "#4B5563" }}>Booking for {totalAttendees} attendee{totalAttendees !== 1 ? "s" : ""} · {event.is_free ? "Free" : `£${subtotal.toFixed(2)}`}</p>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </main>
    );
}
