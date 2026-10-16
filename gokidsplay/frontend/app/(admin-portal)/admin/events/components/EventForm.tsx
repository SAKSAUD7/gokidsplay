"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";
import { MediaUploadField } from "@/components/admin/cms/fields/MediaUploadField";
import { EVENT_TYPES, typeInfo } from "./eventMeta";

/** Fields the admin edits; everything else on the event is read-only. */
export const EMPTY_EVENT = {
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
    is_free: false,
    cover_image: "",
    accent_color: "#EC4899",
    emoji: "🎂",
    is_public: true,
    requires_age_verification: false,
    min_age: "" as string | number,
    max_age: "" as string | number,
    terms_and_conditions: "",
    special_instructions: "",
};

type EventFields = typeof EMPTY_EVENT;

const input = "w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm bg-white";
const label = "block text-sm font-medium text-slate-700 mb-1";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <h2 className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900">{title}</h2>
            <div className="p-6 space-y-4">{children}</div>
        </section>
    );
}

/** The API expects null (not "") for optional times and numbers. */
function toPayload(form: EventFields, status: string) {
    const time = (t: string) => (t ? t.slice(0, 5) : null);
    const num = (v: any) => (v === "" || v === null || v === undefined ? null : Number(v));
    return {
        ...form,
        status,
        start_time: time(form.start_time),
        end_time: time(form.end_time),
        doors_open_time: time(form.doors_open_time),
        min_age: num(form.min_age),
        max_age: num(form.max_age),
        price_per_child: form.is_free ? "0.00" : form.price_per_child || "0.00",
        price_per_adult: form.is_free ? "0.00" : form.price_per_adult || "0.00",
        cover_image: form.cover_image || null,
        deposit_amount: "0.00", // payment is taken at the venue
    };
}

/** Readable message from a DRF validation error body. */
function apiError(data: any): string {
    if (!data) return "Could not save the event";
    if (typeof data === "string") return data;
    const detail = data.detail ?? data.error;
    if (typeof detail === "string") {
        try { return apiError(JSON.parse(detail)); } catch { return detail; }
    }
    const [field, msg] = Object.entries(data)[0] ?? [];
    return field ? `${String(field).replace(/_/g, " ")}: ${Array.isArray(msg) ? msg[0] : msg}` : "Could not save the event";
}

export function EventForm({ eventId, initial, fromRequestId }: { eventId?: number | string; initial?: Partial<EventFields>; fromRequestId?: string | null }) {
    const router = useRouter();
    const [form, setForm] = useState<EventFields>({ ...EMPTY_EVENT, ...stripNulls(initial) });
    const [saving, setSaving] = useState(false);
    const editing = eventId !== undefined;

    const set = (k: keyof EventFields, v: any) =>
        setForm(f => {
            const next: any = { ...f, [k]: v };
            if (k === "event_type" && !editing) {
                next.emoji = typeInfo(v).emoji;
                next.accent_color = typeInfo(v).color;
            }
            return next;
        });

    async function save(status: string) {
        if (!form.title.trim() || !form.date || !form.start_time || !form.end_time) {
            toast.error("Title, date, start time and end time are required");
            return;
        }
        if (form.end_time <= form.start_time) {
            toast.error("The end time must be after the start time");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(editing ? `/api/events?id=${eventId}` : "/api/events", {
                method: editing ? "PATCH" : "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(toPayload(form, status)),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(apiError(data));
            // Created from a customer's request: link the request to the new event
            if (!editing && fromRequestId && data?.id) {
                await fetch(`/api/event-requests?id=${fromRequestId}`, {
                    method: "PATCH", credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: data.id }),
                }).catch(() => {});
            }
            toast.success(status === "PUBLISHED" ? "Event published" : editing ? "Event saved" : "Event saved as draft");
            router.push(`/admin/events/${data?.id ?? eventId}`);
            router.refresh();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="p-8 max-w-4xl space-y-6">
            <div className="flex flex-wrap items-center gap-4">
                <Link href={editing ? `/admin/events/${eventId}` : "/admin/events"} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900">{editing ? "Edit Event" : "Create Event"}</h1>
                    <p className="text-slate-500 mt-1">Customers reserve places online and pay at the venue.</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => save(editing ? form.status : "DRAFT")} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-sm disabled:opacity-50">
                        <Save size={16} /> {editing ? "Save" : "Save Draft"}
                    </button>
                    {form.status !== "PUBLISHED" && (
                        <button type="button" onClick={() => save("PUBLISHED")} disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-50">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Publish
                        </button>
                    )}
                </div>
            </div>

            <Card title="Event type">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EVENT_TYPES.map(t => (
                        <button key={t.value} type="button" onClick={() => set("event_type", t.value)}
                            className={`px-3 py-2.5 rounded-lg border-2 text-sm text-left font-semibold transition-colors ${form.event_type === t.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                            {t.emoji} {t.label}
                        </button>
                    ))}
                </div>
            </Card>

            <Card title="Details">
                <div>
                    <label className={label}>Title *</label>
                    <input className={input} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Neon Halloween Party" />
                </div>
                <div>
                    <label className={label}>Short description (shown on the event cards)</label>
                    <input className={input} maxLength={300} value={form.short_description} onChange={e => set("short_description", e.target.value)} />
                </div>
                <div>
                    <label className={label}>Full description</label>
                    <textarea className={input} rows={5} value={form.description} onChange={e => set("description", e.target.value)} />
                </div>
            </Card>

            <Card title="Date & time">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={label}>Date *</label><input type="date" className={input} value={form.date} onChange={e => set("date", e.target.value)} /></div>
                    <div><label className={label}>Doors open (optional)</label><input type="time" className={input} value={form.doors_open_time?.slice(0, 5) || ""} onChange={e => set("doors_open_time", e.target.value)} /></div>
                    <div><label className={label}>Start time *</label><input type="time" className={input} value={form.start_time?.slice(0, 5) || ""} onChange={e => set("start_time", e.target.value)} /></div>
                    <div><label className={label}>End time *</label><input type="time" className={input} value={form.end_time?.slice(0, 5) || ""} onChange={e => set("end_time", e.target.value)} /></div>
                </div>
            </Card>

            <Card title="Places & prices">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><label className={label}>Total places</label><input type="number" min={1} className={input} value={form.total_capacity} onChange={e => set("total_capacity", parseInt(e.target.value) || 1)} /></div>
                    <div><label className={label}>Held back by staff</label><input type="number" min={0} className={input} value={form.reserved_spots} onChange={e => set("reserved_spots", parseInt(e.target.value) || 0)} /></div>
                    <div><label className={label}>Minimum attendees</label><input type="number" min={1} className={input} value={form.min_attendees} onChange={e => set("min_attendees", parseInt(e.target.value) || 1)} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.is_free} onChange={e => set("is_free", e.target.checked)} /> Free event
                </label>
                {!form.is_free && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={label}>Price per child (£)</label><input type="number" min={0} step="0.01" className={input} value={form.price_per_child} onChange={e => set("price_per_child", e.target.value)} /></div>
                        <div><label className={label}>Price per adult (£)</label><input type="number" min={0} step="0.01" className={input} value={form.price_per_adult} onChange={e => set("price_per_adult", e.target.value)} /></div>
                    </div>
                )}
                <p className="text-xs text-slate-500">Payment is taken at the venue on the day. Reservations hold places straight away.</p>
            </Card>

            <Card title="Look & visibility">
                <MediaUploadField kind="image" label="Cover image" value={form.cover_image || ""} onChange={v => set("cover_image", v)}
                    help="Shown on the event card and at the top of the event page" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={label}>Emoji</label><input className={input} maxLength={10} value={form.emoji} onChange={e => set("emoji", e.target.value)} /></div>
                    <div>
                        <label className={label}>Accent colour</label>
                        <div className="flex gap-2">
                            <input type="color" value={form.accent_color} onChange={e => set("accent_color", e.target.value)} className="h-9 w-12 rounded border border-slate-200" />
                            <input className={input} value={form.accent_color} onChange={e => set("accent_color", e.target.value)} />
                        </div>
                    </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.is_public} onChange={e => set("is_public", e.target.checked)} /> Show on the public events page
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.requires_age_verification} onChange={e => set("requires_age_verification", e.target.checked)} /> Age restricted
                </label>
                {form.requires_age_verification && (
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={label}>Minimum age</label><input type="number" min={0} className={input} value={form.min_age} onChange={e => set("min_age", e.target.value)} /></div>
                        <div><label className={label}>Maximum age</label><input type="number" min={0} className={input} value={form.max_age} onChange={e => set("max_age", e.target.value)} /></div>
                    </div>
                )}
            </Card>

            <Card title="Information for customers">
                <div>
                    <label className={label}>Special instructions (shown after reserving)</label>
                    <textarea className={input} rows={3} value={form.special_instructions} onChange={e => set("special_instructions", e.target.value)} placeholder="What to bring, where to meet…" />
                </div>
                <div>
                    <label className={label}>Terms & conditions</label>
                    <textarea className={input} rows={4} value={form.terms_and_conditions} onChange={e => set("terms_and_conditions", e.target.value)} />
                </div>
            </Card>
        </div>
    );
}

/** API returns null for empty optional fields; inputs need "" instead. */
function stripNulls(obj?: Record<string, any>) {
    if (!obj) return {};
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === null ? "" : v]));
}
