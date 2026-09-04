"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
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

export default function EditEventPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [form, setForm]       = useState<any>(null);

    useEffect(() => {
        fetch(`/api/events?id=${params.id}`, { credentials: "include", cache: "no-store" })
            .then(r => r.json())
            .then(data => { setForm(data); setLoading(false); })
            .catch(() => { toast.error("Failed to load event"); setLoading(false); });
    }, [params.id]);

    function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

    async function save(publish = false) {
        if (!form.title || !form.date || !form.start_time || !form.end_time) {
            toast.error("Title, date, start and end time are required");
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form, status: publish ? "PUBLISHED" : form.status };
            const res = await fetch(`/api/events?id=${params.id}`, {
                method: "PATCH", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success("Event updated!");
            router.push(`/admin/events/${params.id}`);
        } catch (e: any) {
            toast.error("Save failed: " + e.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div style={{ minHeight: "100vh", background: "#0F0F1A", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>Loading…</div>;
    if (!form)   return <div style={{ minHeight: "100vh", background: "#0F0F1A", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>Event not found</div>;

    return (
        <div style={{ minHeight: "100vh", background: "#0F0F1A", padding: "2rem", fontFamily: "Inter, sans-serif", color: "#fff", maxWidth: 900, margin: "0 auto" }}>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <Link href={`/admin/events/${params.id}`} style={{ color: "#6B7280", textDecoration: "none" }}><ArrowLeft size={20} /></Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Edit Event</h1>
                    <p style={{ margin: 0, color: "#6B7280", fontSize: "0.875rem" }}>{form.title}</p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button onClick={() => save(false)} disabled={saving} style={{ padding: "0.6rem 1.25rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#D1D5DB", cursor: "pointer", fontSize: "0.875rem" }}>
                        <Save size={14} style={{ marginRight: 4 }} /> Save
                    </button>
                    {form.status === "DRAFT" && (
                        <button onClick={() => save(true)} disabled={saving} style={{ padding: "0.6rem 1.25rem", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #8B5CF6, #EC4899)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Sparkles size={14} /> Publish
                        </button>
                    )}
                </div>
            </div>

            <Section title="Event Type">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "0.75rem" }}>
                    {EVENT_TYPES.map(t => (
                        <button key={t.value} onClick={() => set("event_type", t.value)}
                            style={{ padding: "0.65rem 0.75rem", borderRadius: 9, border: `2px solid ${form.event_type === t.value ? t.color : "rgba(255,255,255,0.08)"}`, background: form.event_type === t.value ? `${t.color}18` : "rgba(255,255,255,0.03)", color: form.event_type === t.value ? t.color : "#9CA3AF", cursor: "pointer", fontSize: "0.78rem", fontWeight: form.event_type === t.value ? 700 : 400, textAlign: "left" }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </Section>

            <Section title="Event Details">
                <div style={{ marginBottom: "1rem" }}>
                    <label style={labelStyle}>Title *</label>
                    <input value={form.title || ""} onChange={e => set("title", e.target.value)} style={fieldStyle} />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={labelStyle}>Short Description</label>
                    <input value={form.short_description || ""} onChange={e => set("short_description", e.target.value)} style={fieldStyle} maxLength={300} />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={labelStyle}>Full Description</label>
                    <textarea value={form.description || ""} onChange={e => set("description", e.target.value)} rows={4} style={{ ...fieldStyle, resize: "vertical" }} />
                </div>
                <Grid2>
                    <div>
                        <label style={labelStyle}>Emoji</label>
                        <input value={form.emoji || "🎉"} onChange={e => set("emoji", e.target.value)} style={fieldStyle} maxLength={10} />
                    </div>
                    <div>
                        <label style={labelStyle}>Accent Colour</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input type="color" value={form.accent_color || "#8B5CF6"} onChange={e => set("accent_color", e.target.value)} style={{ width: 44, height: 36, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", padding: 2, background: "none" }} />
                            <input value={form.accent_color || "#8B5CF6"} onChange={e => set("accent_color", e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
                        </div>
                    </div>
                </Grid2>
            </Section>

            <Section title="📅 Date & Time">
                <Grid2>
                    <div><label style={labelStyle}>Event Date *</label><input type="date" value={form.date || ""} onChange={e => set("date", e.target.value)} style={fieldStyle} /></div>
                    <div><label style={labelStyle}>Doors Open</label><input type="time" value={form.doors_open_time || ""} onChange={e => set("doors_open_time", e.target.value)} style={fieldStyle} /></div>
                    <div><label style={labelStyle}>Start Time *</label><input type="time" value={form.start_time || ""} onChange={e => set("start_time", e.target.value)} style={fieldStyle} /></div>
                    <div><label style={labelStyle}>End Time *</label><input type="time" value={form.end_time || ""} onChange={e => set("end_time", e.target.value)} style={fieldStyle} /></div>
                </Grid2>
            </Section>

            <Section title="👥 Capacity">
                <Grid2>
                    <div><label style={labelStyle}>Total Capacity</label><input type="number" value={form.total_capacity || 30} onChange={e => set("total_capacity", parseInt(e.target.value) || 0)} style={fieldStyle} min={1} /></div>
                    <div><label style={labelStyle}>Reserved Spots</label><input type="number" value={form.reserved_spots || 0} onChange={e => set("reserved_spots", parseInt(e.target.value) || 0)} style={fieldStyle} min={0} /></div>
                </Grid2>
            </Section>

            <Section title="💷 Pricing">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginBottom: "1rem" }}>
                    <input type="checkbox" checked={form.is_free || false} onChange={e => set("is_free", e.target.checked)} />
                    <span style={{ color: "#D1D5DB", fontSize: "0.875rem" }}>Free event</span>
                </label>
                {!form.is_free && (
                    <Grid2>
                        <div><label style={labelStyle}>Child Price (£)</label><input type="number" value={form.price_per_child || "0.00"} onChange={e => set("price_per_child", e.target.value)} style={fieldStyle} step="0.01" min={0} /></div>
                        <div><label style={labelStyle}>Adult Price (£)</label><input type="number" value={form.price_per_adult || "0.00"} onChange={e => set("price_per_adult", e.target.value)} style={fieldStyle} step="0.01" min={0} /></div>
                        <div><label style={labelStyle}>Deposit (£) — 0 = full payment</label><input type="number" value={form.deposit_amount || "0.00"} onChange={e => set("deposit_amount", e.target.value)} style={fieldStyle} step="0.01" min={0} /></div>
                    </Grid2>
                )}
            </Section>

            <Section title="⚙️ Settings">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.is_public ?? true} onChange={e => set("is_public", e.target.checked)} />
                        <span style={{ color: "#D1D5DB", fontSize: "0.875rem" }}>Show on public events page</span>
                    </label>
                </div>
                <div>
                    <label style={labelStyle}>Status</label>
                    <select value={form.status || "DRAFT"} onChange={e => set("status", e.target.value)} style={{ ...fieldStyle }}>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="SOLD_OUT">Sold Out</option>
                    </select>
                </div>
            </Section>

            <Section title="📋 Content">
                <div style={{ marginBottom: "1rem" }}>
                    <label style={labelStyle}>Special Instructions (shown after booking)</label>
                    <textarea value={form.special_instructions || ""} onChange={e => set("special_instructions", e.target.value)} rows={3} style={{ ...fieldStyle, resize: "vertical" }} />
                </div>
                <div>
                    <label style={labelStyle}>Terms & Conditions</label>
                    <textarea value={form.terms_and_conditions || ""} onChange={e => set("terms_and_conditions", e.target.value)} rows={4} style={{ ...fieldStyle, resize: "vertical" }} />
                </div>
            </Section>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
                <Link href={`/admin/events/${params.id}`}><button style={{ padding: "0.7rem 1.5rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "none", color: "#9CA3AF", cursor: "pointer" }}>Cancel</button></Link>
                <button onClick={() => save(false)} disabled={saving} style={{ padding: "0.7rem 1.75rem", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", cursor: "pointer", fontWeight: 700 }}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
        </div>
    );
}
