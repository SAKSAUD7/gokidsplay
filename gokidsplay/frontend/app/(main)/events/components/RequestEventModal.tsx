"use client";

import { useEffect, useState } from "react";
import { X, Send, CheckCircle, Loader2 } from "lucide-react";
import { todayInUK } from "@/lib/api/types";

const EVENT_TYPES = [
    { value: "BIRTHDAY", label: "🎂 Birthday party" },
    { value: "CHRISTMAS", label: "🎄 Christmas party" },
    { value: "HALLOWEEN", label: "🎃 Halloween party" },
    { value: "EASTER", label: "🐣 Easter party" },
    { value: "PAJAMA", label: "🌙 Pajama party" },
    { value: "SCHOOL_HOLIDAY", label: "📚 School / group trip" },
    { value: "SUMMER", label: "☀️ Summer party" },
    { value: "CUSTOM", label: "🎯 Something else" },
];

const EMPTY = {
    name: "", email: "", phone: "",
    event_type: "BIRTHDAY", preferred_date: "", alternative_date: "", preferred_time: "",
    num_children: "10", num_adults: "", budget: "", details: "",
};

const field = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-400";
const label = "block text-white/70 text-sm font-semibold mb-1.5";

/** "Request an Event": customers ask Go Kids Play to organise an event for them. */
export function RequestEventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [form, setForm] = useState(EMPTY);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState("");

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [open, onClose]);

    if (!open) return null;

    const set = (k: keyof typeof EMPTY, v: string) => setForm(f => ({ ...f, [k]: v }));
    const today = todayInUK();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSending(true);
        try {
            const res = await fetch("/api/event-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    num_children: parseInt(form.num_children) || 0,
                    num_adults: parseInt(form.num_adults) || 0,
                    alternative_date: form.alternative_date || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Sorry, we couldn't send your request. Please try again.");
            setDone(data.message || "Thanks! We've received your request and will be in touch.");
            setForm(EMPTY);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    const close = () => { setDone(""); setError(""); onClose(); };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Request an event">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
            <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-[#12091f] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-5 bg-[#12091f]/95 backdrop-blur border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-black text-white">Request an Event</h2>
                        <p className="text-white/50 text-sm mt-1">Tell us what you have in mind and we&apos;ll get back to you to plan it together.</p>
                    </div>
                    <button onClick={close} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {done ? (
                    <div className="px-6 py-12 text-center space-y-4">
                        <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
                        <p className="text-white text-lg font-semibold">{done}</p>
                        <p className="text-white/50 text-sm">You can also call us on 07349 110865.</p>
                        <button onClick={close} className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold">Done</button>
                    </div>
                ) : (
                    <form onSubmit={submit} className="px-6 py-6 space-y-5">
                        <div>
                            <label className={label}>What kind of event?</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {EVENT_TYPES.map(t => (
                                    <button type="button" key={t.value} onClick={() => set("event_type", t.value)}
                                        className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${form.event_type === t.value ? "border-pink-400 bg-pink-500/20 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div><label className={label}>Preferred date *</label><input type="date" required min={today} className={field} value={form.preferred_date} onChange={e => set("preferred_date", e.target.value)} /></div>
                            <div><label className={label}>Alternative date</label><input type="date" min={today} className={field} value={form.alternative_date} onChange={e => set("alternative_date", e.target.value)} /></div>
                            <div><label className={label}>Preferred time</label><input className={field} value={form.preferred_time} onChange={e => set("preferred_time", e.target.value)} placeholder="e.g. Afternoon" /></div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div><label className={label}>Children *</label><input type="number" min={0} max={500} required className={field} value={form.num_children} onChange={e => set("num_children", e.target.value)} /></div>
                            <div><label className={label}>Adults</label><input type="number" min={0} max={500} className={field} value={form.num_adults} onChange={e => set("num_adults", e.target.value)} /></div>
                            <div className="col-span-2 sm:col-span-1"><label className={label}>Budget (optional)</label><input className={field} value={form.budget} onChange={e => set("budget", e.target.value)} placeholder="e.g. £300" /></div>
                        </div>

                        <div>
                            <label className={label}>Tell us about your event *</label>
                            <textarea required minLength={10} rows={4} className={field} value={form.details} onChange={e => set("details", e.target.value)}
                                placeholder="Theme, ages, food, anything special you'd like…" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div><label className={label}>Your name *</label><input required className={field} value={form.name} onChange={e => set("name", e.target.value)} autoComplete="name" /></div>
                            <div><label className={label}>Email *</label><input type="email" required className={field} value={form.email} onChange={e => set("email", e.target.value)} autoComplete="email" /></div>
                            <div><label className={label}>Phone *</label><input type="tel" required className={field} value={form.phone} onChange={e => set("phone", e.target.value)} autoComplete="tel" /></div>
                        </div>

                        {error && <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{error}</p>}

                        <button type="submit" disabled={sending}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-lg hover:opacity-90 disabled:opacity-50">
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Send Request
                        </button>
                        <p className="text-center text-white/40 text-xs">No payment needed. We&apos;ll contact you to confirm the details and price.</p>
                    </form>
                )}
            </div>
        </div>
    );
}
