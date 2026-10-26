"use client";

import { useEffect, useMemo, useState } from "react";
import { createBooking } from "@/app/actions/createBooking";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Clock, Users, User, Mail, Phone, Ticket, ArrowLeft, Minus, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { applySessionRules, getOpeningHours, getSessionRules, formatClock, todayInUK } from "@/lib/api/types";
import { loadOpeningCalendar } from "@/lib/api/opening-calendar";

interface TicketPlan { id: number; name: string; price: string; is_spectator?: boolean; order?: number }

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
const input = "w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent";

/** Session start times for staff: every session that day, including ones already under way. */
function staffSessionTimes(date: string): string[] {
    const hours = getOpeningHours(date) ?? getSessionRules().holiday_hours;
    if (!date || !hours) return [];
    const rules = getSessionRules();
    if (rules.session_mode === "ANYTIME") return [hours.open];
    const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const out: string[] = [];
    for (let t = toMin(hours.open); t + rules.duration_minutes <= toMin(hours.close); t += rules.arrival_interval_minutes) {
        out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
    }
    return out;
}

export default function NewSessionBookingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<TicketPlan[]>([]);
    const [qty, setQty] = useState<Record<number, number>>({});
    const [fee, setFee] = useState(0);
    const [rulesReady, setRulesReady] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "", date: todayInUK(), time: "", voucherCode: "", paidAtDesk: true });

    useEffect(() => {
        fetch(`${API}/cms/pricing-plans/`).then(r => (r.ok ? r.json() : [])).then((data: any[]) =>
            setPlans((Array.isArray(data) ? data : []).filter(p => p.type === "SESSION" && p.active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))),
        ).catch(() => setPlans([]));
        // Session rules + the opening calendar (holidays and Opening Days changes)
        Promise.all([
            fetch(`${API}/cms/session-booking-config/1/`).then(r => (r.ok ? r.json() : null)).then(cfg => {
                if (cfg) { applySessionRules(cfg); setFee(0); }
            }).catch(() => {}),
            loadOpeningCalendar(),
        ]).finally(() => setRulesReady(true));
    }, []);

    const times = useMemo(() => (rulesReady ? staffSessionTimes(form.date) : []), [form.date, rulesReady]);
    useEffect(() => {
        if (times.length && !times.includes(form.time)) setForm(f => ({ ...f, time: times[0] }));
    }, [times, form.time]);

    const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));
    const lines = plans.filter(p => (qty[p.id] || 0) > 0).map(p => ({ plan: p, qty: qty[p.id], total: parseFloat(p.price) * qty[p.id] }));
    const total = lines.reduce((s, l) => s + l.total, 0) + fee;
    const players = plans.filter(p => !p.is_spectator).reduce((s, p) => s + (qty[p.id] || 0), 0);
    const spectators = plans.filter(p => p.is_spectator).reduce((s, p) => s + (qty[p.id] || 0), 0);
    const hours = rulesReady ? getOpeningHours(form.date) : null;
    const anytime = getSessionRules().session_mode === "ANYTIME";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (players === 0) { toast.error("Add at least one playing ticket"); return; }
        if (!form.time) { toast.error("Choose a session"); return; }
        setLoading(true);
        try {
            const result = await createBooking({
                staffBooking: true,
                date: form.date,
                time: form.time,
                duration: String(getSessionRules().duration_minutes),
                adults: 0,
                kids: players,
                spectators,
                tickets: qty,
                name: form.name,
                email: form.email,
                phone: form.phone,
                voucherCode: form.voucherCode || undefined,
                activity: "all-access",
                paidAtDesk: form.paidAtDesk,
            });
            if (result.success) {
                toast.success(result.bookingNumber ? `Booking ${result.bookingNumber} created` : "Booking created");
                router.push("/admin/session-bookings");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to create booking");
            }
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/session-bookings" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4">
                    <ArrowLeft size={16} /> Back to Session Bookings
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Manual Booking — Walk-in / Phone</h1>
                <p className="text-slate-500 mt-1">Book an all-access play session for a walk-in or phone customer. No online booking fee is added.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
                <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Customer</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                            <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input required className={input} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jane Smith" /></div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input required type="email" className={input} value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@example.com" /></div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input required type="tel" className={input} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="07700 900000" /></div>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Session</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input required type="date" min={todayInUK()} className={input} value={form.date} onChange={e => set("date", e.target.value)} /></div>
                            <p className="text-xs text-slate-500 mt-1">
                                {hours ? `Open ${formatClock(hours.open)} – ${formatClock(hours.close)}` : "Normally closed this day (fine for a school or bank holiday)"}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{anytime ? "Session" : "Arrival time"}</label>
                            <div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select required className={`${input} bg-white appearance-none`} value={form.time} onChange={e => set("time", e.target.value)}>
                                    {times.map(t => (
                                        <option key={t} value={t}>{anytime && hours ? `Any ${getSessionRules().duration_minutes / 60} hours, ${formatClock(hours.open)} – ${formatClock(hours.close)}` : formatClock(t)}</option>
                                    ))}
                                </select></div>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Tickets</h3>
                    {plans.length === 0 ? <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading ticket types…</p> : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                            {plans.map(p => (
                                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                                    <div>
                                        <div className="font-semibold text-slate-900">{p.name}</div>
                                        <div className="text-xs text-slate-500">£{parseFloat(p.price).toFixed(2)}{p.is_spectator ? " · doesn't play" : ""}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button type="button" aria-label={`Remove one: ${p.name}`} onClick={() => setQty(q => ({ ...q, [p.id]: Math.max(0, (q[p.id] || 0) - 1) }))}
                                            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50"><Minus size={14} /></button>
                                        <span className="w-6 text-center font-bold text-slate-900">{qty[p.id] || 0}</span>
                                        <button type="button" aria-label={`Add one: ${p.name}`} onClick={() => setQty(q => ({ ...q, [p.id]: Math.min(50, (q[p.id] || 0) + 1) }))}
                                            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"><Plus size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Voucher code (optional)</label>
                        <div className="relative"><Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input className={`${input} uppercase`} value={form.voucherCode} onChange={e => set("voucherCode", e.target.value)} placeholder="DISCOUNT20" /></div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        {lines.map(l => (
                            <div key={l.plan.id} className="flex justify-between text-sm text-slate-700"><span>{l.plan.name} × {l.qty}</span><span>£{l.total.toFixed(2)}</span></div>
                        ))}
                        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 mt-2 pt-2"><span>Total</span><span>£{total.toFixed(2)}</span></div>
                        <label className="flex items-center gap-2 text-sm text-slate-700 mt-3">
                            <input type="checkbox" checked={form.paidAtDesk} onChange={e => set("paidAtDesk", e.target.checked)} /> Paid at the desk
                        </label>
                    </div>
                </section>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                    <Link href="/admin/session-bookings" className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50">Cancel</Link>
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {loading ? "Creating booking…" : "Create Booking"}
                    </button>
                </div>
            </form>
        </div>
    );
}
