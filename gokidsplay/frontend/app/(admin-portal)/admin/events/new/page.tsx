"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Calendar, Clock, Users, PoundSterling, Sparkles } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const EVENT_TYPES = [
    { value: "BIRTHDAY",       label: "🎂 Birthday Party",       color: "#EC4899" },
    { value: "CHRISTMAS",      label: "🎄 Christmas Party",      color: "#16A34A" },
    { value: "PAJAMA",         label: "🌙 Pajama Party",         color: "#6366F1" },
    { value: "HALLOWEEN",      label: "🎃 Halloween Party",      color: "#F97316" },
    { value: "EASTER",         label: "🐣 Easter Party",         color: "#84CC16" },
    { value: "SCHOOL_HOLIDAY", label: "📚 School Holiday Event", color: "#0EA5E9" },
    { value: "SUMMER",         label: "☀️ Summer Event",         color: "#EAB308" },
    { value: "SPECIAL",        label: "✨ Special Event",         color: "#8B5CF6" },
    { value: "CUSTOM",         label: "🎯 Custom Event",          color: "#6B7280" },
];

const TYPE_EMOJIS: Record<string, string> = {
    BIRTHDAY: "🎂", CHRISTMAS: "🎄", PAJAMA: "🌙", HALLOWEEN: "🎃",
    EASTER: "🐣", SCHOOL_HOLIDAY: "📚", SUMMER: "☀️", SPECIAL: "✨", CUSTOM: "🎯"
};

const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.9rem", borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
    color: "#fff", fontSize: "0.875rem", boxSizing: "border-box", outline: "none",
};

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.78rem", color: "#9CA3AF",
    marginBottom: "0.4rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.95rem", fontWeight: 700, color: "#D1D5DB", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem" }}>{title}</h2>
            {children}
        </div>
    );
}

function Grid2({ children }: { children: React.ReactNode }) {
    return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>{children}</div>;
}

export default function NewEventPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        event_type: "BIRTHDAY",
        title: "",
        short_description: "",
        description: "",
        status: "DRAFT",
        date: "",
        start_time: "",
        end_time: "",
        doors_open_time: "",
        total_capacity: 30,
        min_attendees: 1,
        reserved_spots: 0,
        price_per_child: "0.00",
        price_per_adult: "0.00",
        deposit_amount: "0.00",
        is_free: false,
        cover_image: "",
        accent_color: "#8B5CF6",
        emoji: "🎉",
        is_public: true,
        requires_age_verification: false,
        min_age: "",
        max_age: "",
        terms_and_conditions: "",
        special_instructions: "",
    });

    function set(k: string, v: any) {
        setForm(f => {
            const updated: any = { ...f, [k]: v };
            // Auto-set emoji from event type
            if (k === "event_type") {
                updated.emoji = TYPE_EMOJIS[v] || "🎉";
                updated.accent_color = EVENT_TYPES.find(t => t.value === v)?.color || "#8B5CF6";
            }
            return updated;
        });
    }

    async function handleSubmit(publish = false) {
        if (!form.title || !form.date || !form.start_time || !form.end_time) {
            toast.error("Title, date, start time and end time are required");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                status: publish ? "PUBLISHED" : "DRAFT",
                min_age: form.min_age ? parseInt(form.min_age) : null,
                max_age: form.max_age ? parseInt(form.max_age) : null,
            };
            const res = await fetch("/api/events", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(JSON.stringify(err));
            }
            const data = await res.json();
            toast.success(publish ? "Event published! 🎉" : "Event saved as draft");
            router.push(`/admin/events/${data.id}`);
        } catch (e: any) {
            toast.error("Failed to save: " + e.message);
        } finally {
            setSaving(false);
        }
    }

    const selectedType = EVENT_TYPES.find(t => t.value === form.event_type);

    return (
        <div style={{ minHeight: "100vh", background: "#0F0F1A", padding: "2rem", fontFamily: "Inter, sans-serif", color: "#fff", maxWidth: 900, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <Link href="/admin/events" style={{ color: "#6B7280", textDecoration: "none" }}>
                    <ArrowLeft size={20} />
                </Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Create New Event</h1>
                    <p style={{ margin: 0, color: "#6B7280", fontSize: "0.875rem" }}>Set up a special event for Go Kids Play</p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button onClick={() => handleSubmit(false)} disabled={saving} style={{ padding: "0.6rem 1.25rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#D1D5DB", cursor: "pointer", fontSize: "0.875rem" }}>
                        Save Draft
                    </button>
                    <button onClick={() => handleSubmit(true)} disabled={saving} style={{ padding: "0.6rem 1.25rem", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #8B5CF6, #EC4899)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Sparkles size={15} /> {saving ? "Saving…" : "Publish Event"}
                    </button>
                </div>
            </div>

            {/* Event type selector */}
            <Section title="Event Type">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
                    {EVENT_TYPES.map(t => (
                        <button key={t.value} onClick={() => set("event_type", t.value)}
                            style={{ padding: "0.75rem", borderRadius: 10, border: `2px solid ${form.event_type === t.value ? t.color : "rgba(255,255,255,0.08)"}`, background: form.event_type === t.value ? `${t.color}18` : "rgba(255,255,255,0.03)", color: form.event_type === t.value ? t.color : "#9CA3AF", cursor: "pointer", fontSize: "0.8rem", fontWeight: form.event_type === t.value ? 700 : 400, textAlign: "left", transition: "all 0.15s" }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Identity */}
            <Section title="Event Details">
                <div style={{ marginBottom: "1rem" }}>
                    <label style={labelStyle}>Event Title *</label>
                    <input value={form.title} onChange={e => set("title", e.target.value)} placeholder={`e.g. ${selectedType?.label} at Go Kids Play`} style={fieldStyle} />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={labelStyle}>Short Description (shown on cards)</label>
                    <input value={form.short_description} onChange={e => set("short_description", e.target.value)} placeholder="One-line summary..." style={fieldStyle} maxLength={300} />
                </div>
                <div>
                    <label style={labelStyle}>Full Description</label>
                    <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} placeholder="Describe the event in detail..." style={{ ...fieldStyle, resize: "vertical", minHeight: 100 }} />
                </div>
            </Section>

            {/* Scheduling */}
            <Section title="📅 Date & Time">
                <Grid2>
                    <div>
                        <label style={labelStyle}>Event Date *</label>
                        <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={fieldStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Doors Open</label>
                        <input type="time" value={form.doors_open_time} onChange={e => set("doors_open_time", e.target.value)} style={fieldStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Start Time *</label>
                        <input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)} style={fieldStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>End Time *</label>
                        <input type="time" value={form.end_time} onChange={e => set("end_time", e.target.value)} style={fieldStyle} />
                    </div>
                </Grid2>
            </Section>

            {/* Capacity */}
            <Section title="👥 Capacity">
                <Grid2>
                    <div>
                        <label style={labelStyle}>Total Capacity</label>
                        <input type="number" value={form.total_capacity} onChange={e => set("total_capacity", parseInt(e.target.value) || 0)} style={fieldStyle} min={1} />
                    </div>
                    <div>
                        <label style={labelStyle}>Reserved Spots (admin only)</label>
                        <input type="number" value={form.reserved_spots} onChange={e => set("reserved_spots", parseInt(e.target.value) || 0)} style={fieldStyle} min={0} />
                    </div>
                    <div>
                        <label style={labelStyle}>Min Attendees</label>
                        <input type="number" value={form.min_attendees} onChange={e => set("min_attendees", parseInt(e.target.value) || 1)} style={fieldStyle} min={1} />
                    </div>
                </Grid2>
            </Section>

            {/* Pricing */}
            <Section title="💷 Pricing">
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.is_free} onChange={e => set("is_free", e.target.checked)} />
                        <span style={{ color: "#D1D5DB", fontSize: "0.875rem" }}>This is a free event</span>
                    </label>
                </div>
                {!form.is_free && (
                    <Grid2>
                        <div>
                            <label style={labelStyle}>Price per Child (£)</label>
                            <input type="number" value={form.price_per_child} onChange={e => set("price_per_child", e.target.value)} style={fieldStyle} step="0.01" min={0} />
                        </div>
                        <div>
                            <label style={labelStyle}>Price per Adult (£)</label>
                            <input type="number" value={form.price_per_adult} onChange={e => set("price_per_adult", e.target.value)} style={fieldStyle} step="0.01" min={0} />
                        </div>
                        <div>
                            <label style={labelStyle}>Deposit Amount (£) — 0 = full payment required</label>
                            <input type="number" value={form.deposit_amount} onChange={e => set("deposit_amount", e.target.value)} style={fieldStyle} step="0.01" min={0} />
                        </div>
                    </Grid2>
                )}
            </Section>

            {/* Settings */}
            <Section title="⚙️ Settings & Visibility">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.is_public} onChange={e => set("is_public", e.target.checked)} />
                        <span style={{ color: "#D1D5DB", fontSize: "0.875rem" }}>Show on public events page</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.requires_age_verification} onChange={e => set("requires_age_verification", e.target.checked)} />
                        <span style={{ color: "#D1D5DB", fontSize: "0.875rem" }}>Requires age verification</span>
                    </label>
                </div>
                {form.requires_age_verification && (
                    <Grid2>
                        <div>
                            <label style={labelStyle}>Min Age</label>
                            <input type="number" value={form.min_age} onChange={e => set("min_age", e.target.value)} style={fieldStyle} min={0} />
                        </div>
                        <div>
                            <label style={labelStyle}>Max Age</label>
                            <input type="number" value={form.max_age} onChange={e => set("max_age", e.target.value)} style={fieldStyle} min={0} />
                        </div>
                    </Grid2>
                )}
            </Section>

            {/* Branding */}
            <Section title="🎨 Branding">
                <Grid2>
                    <div>
                        <label style={labelStyle}>Emoji</label>
                        <input value={form.emoji} onChange={e => set("emoji", e.target.value)} style={fieldStyle} maxLength={10} placeholder="🎉" />
                    </div>
                    <div>
                        <label style={labelStyle}>Accent Colour</label>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <input type="color" value={form.accent_color} onChange={e => set("accent_color", e.target.value)} style={{ width: 44, height: 36, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", background: "none", padding: 2 }} />
                            <input value={form.accent_color} onChange={e => set("accent_color", e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
                        </div>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>Cover Image URL</label>
                        <input value={form.cover_image} onChange={e => set("cover_image", e.target.value)} placeholder="https://..." style={fieldStyle} />
                    </div>
                </Grid2>
            </Section>

            {/* Content */}
            <Section title="📋 Terms & Instructions">
                <div style={{ marginBottom: "1rem" }}>
                    <label style={labelStyle}>Terms & Conditions</label>
                    <textarea value={form.terms_and_conditions} onChange={e => set("terms_and_conditions", e.target.value)} rows={4} placeholder="Event terms and conditions..." style={{ ...fieldStyle, resize: "vertical" }} />
                </div>
                <div>
                    <label style={labelStyle}>Special Instructions (shown to customers after booking)</label>
                    <textarea value={form.special_instructions} onChange={e => set("special_instructions", e.target.value)} rows={3} placeholder="What to bring, where to go, etc." style={{ ...fieldStyle, resize: "vertical" }} />
                </div>
            </Section>

            {/* Bottom actions */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "1rem" }}>
                <Link href="/admin/events">
                    <button style={{ padding: "0.7rem 1.5rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "none", color: "#9CA3AF", cursor: "pointer" }}>Cancel</button>
                </Link>
                <button onClick={() => handleSubmit(false)} disabled={saving} style={{ padding: "0.7rem 1.5rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#D1D5DB", cursor: "pointer" }}>
                    Save Draft
                </button>
                <button onClick={() => handleSubmit(true)} disabled={saving} style={{ padding: "0.7rem 1.75rem", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #8B5CF6, #EC4899)", color: "#fff", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles size={15} /> {saving ? "Saving…" : "Publish Event"}
                </button>
            </div>
        </div>
    );
}
