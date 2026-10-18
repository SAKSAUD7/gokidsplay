"use client";

/**
 * Opening Days — when Go Kids Play is open for online bookings.
 *
 * Each date starts from the normal rules (weekly hours from Website Content →
 * Session Booking, plus every Coventry school & bank holiday). Staff can open a
 * date specially (with its own hours) or close it for play sessions and/or
 * parties. The session and party booking calendars use exactly this calendar
 * (GET /bookings/public/calendar/), and the server rejects bookings on closed dates.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarCheck, CalendarX, ChevronLeft, ChevronRight, Loader2, RotateCcw, X } from "lucide-react";
import { fetchOpeningCalendar } from "@/lib/api/opening-calendar";
import { formatClock, todayInUK, type CalendarDay } from "@/lib/api/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const prettyDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const hoursText = (day: CalendarDay) => (day.open && day.close ? `${formatClock(day.open)} – ${formatClock(day.close)}` : "");

interface Override {
    id: number;
    type: string;
    reason: string;
    start_date: string;
    end_date: string;
    open_time: string | null;
    close_time: string | null;
    blocks_normal_bookings: boolean;
    blocks_party_bookings: boolean;
}

/** How a day looks in the grid. */
function dayLook(day: CalendarDay | undefined) {
    if (!day) return { cell: "bg-slate-50 text-slate-400", label: "", tag: "" };
    if (day.source === "special_opening") return { cell: "bg-sky-50 border-sky-300 text-sky-900", label: hoursText(day), tag: "Special opening" };
    if (day.source === "closure") {
        if (day.sessions_open) return { cell: "bg-amber-50 border-amber-300 text-amber-900", label: hoursText(day), tag: "Parties closed" };
        if (day.parties_open) return { cell: "bg-amber-50 border-amber-300 text-amber-900", label: "Parties only", tag: "Sessions closed" };
        return { cell: "bg-red-50 border-red-300 text-red-800", label: day.reason || "Closed", tag: "Closed" };
    }
    if (!day.sessions_open) return { cell: "bg-slate-100 border-slate-200 text-slate-400", label: "Closed", tag: "" };
    if (day.source === "school_holiday" || day.source === "bank_holiday") {
        return { cell: "bg-emerald-50 border-emerald-300 text-emerald-900", label: hoursText(day), tag: day.source === "bank_holiday" ? "Bank holiday" : "School holiday" };
    }
    return { cell: "bg-white border-slate-200 text-slate-800", label: hoursText(day), tag: "" };
}

function OpeningDays() {
    const params = useSearchParams();
    const today = todayInUK();
    const initial = params.get("date") || today;
    const [year, setYear] = useState(Number(initial.slice(0, 4)));
    const [month, setMonth] = useState(Number(initial.slice(5, 7)) - 1);
    const [days, setDays] = useState<Record<string, CalendarDay>>({});
    const [bookings, setBookings] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<string | null>(params.get("date"));

    const first = ymd(year, month, 1);
    const last = ymd(year, month, new Date(year, month + 1, 0).getDate());

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [calendar, bookingRes] = await Promise.all([
                fetchOpeningCalendar(first, last),
                fetch(`/api/calendar?start_date=${first}&end_date=${last}`, { cache: "no-store" }).catch(() => null),
            ]);
            setDays(Object.fromEntries(calendar.map(d => [d.date, d])));
            const counts: Record<string, number> = {};
            if (bookingRes && bookingRes.ok) {
                const data = await bookingRes.json();
                for (const e of data.events || []) {
                    const d = String(e.start || "").slice(0, 10);
                    if (d && !/cancel/i.test(e.status || "")) counts[d] = (counts[d] || 0) + 1;
                }
            }
            setBookings(counts);
        } catch (e: any) {
            setError(e?.message || "Could not load the calendar.");
        } finally {
            setLoading(false);
        }
    }, [first, last]);

    useEffect(() => { load(); }, [load]);

    const move = (delta: number) => {
        const d = new Date(year, month + delta, 1);
        setYear(d.getFullYear());
        setMonth(d.getMonth());
    };

    const cells = useMemo(() => {
        const offset = (new Date(year, month, 1).getDay() + 6) % 7;
        const count = new Date(year, month + 1, 0).getDate();
        return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => ymd(year, month, i + 1))];
    }, [year, month]);

    const monthDays = Object.values(days);
    const openCount = monthDays.filter(d => d.sessions_open).length;
    const overrides = monthDays.filter(d => d.override_id).length;

    return (
        <div className="p-3 sm:p-6 md:p-8 space-y-6">
            <div className="flex items-start gap-4">
                <Link href="/admin/calendar" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 mt-1"><ArrowLeft size={20} /></Link>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Opening Days</h1>
                    <p className="text-slate-500 mt-1 max-w-3xl text-sm sm:text-base">
                        When customers can book online. Normal opening comes from the weekly hours in{" "}
                        <Link href="/admin/cms/session-booking" className="text-blue-700 font-semibold underline">Website Content → Session Booking</Link>{" "}
                        plus every Coventry school &amp; bank holiday. Click a date to open it specially or close it — the session and
                        party booking calendars change straight away.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <button onClick={() => move(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Previous month"><ChevronLeft size={18} /></button>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 w-32 sm:w-44 text-center">{MONTHS[month]} {year}</h2>
                        <button onClick={() => move(1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Next month"><ChevronRight size={18} /></button>
                        <button onClick={() => { setYear(Number(today.slice(0, 4))); setMonth(Number(today.slice(5, 7)) - 1); }}
                            className="ml-1 sm:ml-2 text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-50">Today</button>
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                    </div>
                    <div className="text-sm text-slate-500">
                        <strong className="text-slate-800">{openCount}</strong> open days this month
                        {overrides > 0 && <> · <strong className="text-slate-800">{overrides}</strong> changed by staff</>}
                    </div>
                </div>

                {error && <p className="m-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

                <div className="p-2 sm:p-4">
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
                        {WEEKDAYS.map(d => <div key={d} className="text-center text-[10px] sm:text-xs font-bold uppercase text-slate-400 py-1">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                        {cells.map((date, i) => {
                            if (!date) return <div key={`blank-${i}`} />;
                            const day = days[date];
                            const look = dayLook(day);
                            const count = bookings[date] || 0;
                            return (
                                <button key={date} onClick={() => setSelected(date)} data-date={date}
                                    data-open={day?.sessions_open ? "true" : "false"}
                                    className={`text-left min-h-[52px] sm:min-h-[88px] rounded-lg border p-1 sm:p-2 transition hover:shadow-md hover:-translate-y-px ${look.cell}
                                        ${selected === date ? "ring-2 ring-blue-500" : ""} ${date === today ? "outline outline-2 outline-offset-1 outline-blue-300" : ""}`}>
                                    <div className="flex items-start justify-between gap-1">
                                        <span className="font-bold text-sm">{Number(date.slice(8))}</span>
                                        {count > 0 && <span className="text-[9px] sm:text-[10px] font-bold bg-blue-600 text-white rounded-full px-1 sm:px-1.5">{count}</span>}
                                    </div>
                                    {/* On phones the colour shows the status; tap the day for details */}
                                    {look.tag && <div className="hidden sm:block text-[10px] font-bold uppercase tracking-wide mt-1 opacity-80">{look.tag}</div>}
                                    <div className="hidden sm:block text-[11px] mt-0.5 leading-tight line-clamp-2">{look.label}</div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-slate-600">
                        {[
                            ["bg-white border-slate-300", "Open (weekly hours)"],
                            ["bg-emerald-50 border-emerald-300", "School / bank holiday — open"],
                            ["bg-sky-50 border-sky-300", "Special opening"],
                            ["bg-amber-50 border-amber-300", "Sessions or parties closed"],
                            ["bg-red-50 border-red-300", "Closed by staff"],
                            ["bg-slate-100 border-slate-200", "Closed"],
                        ].map(([cls, label]) => (
                            <span key={label} className="flex items-center gap-1.5"><span className={`w-3.5 h-3.5 rounded border ${cls}`} />{label}</span>
                        ))}
                        <span className="flex items-center gap-1.5"><span className="text-[10px] font-bold bg-blue-600 text-white rounded-full px-1.5">2</span>bookings</span>
                    </div>
                </div>
            </div>

            {selected && (
                <DayPanel
                    key={selected}
                    date={selected}
                    day={days[selected]}
                    bookingCount={bookings[selected] || 0}
                    onClose={() => setSelected(null)}
                    onSaved={load}
                />
            )}
        </div>
    );
}

function DayPanel({ date, day, bookingCount, onClose, onSaved }: {
    date: string; day?: CalendarDay; bookingCount: number; onClose: () => void; onSaved: () => void;
}) {
    const [override, setOverride] = useState<Override | null>(null);
    const [mode, setMode] = useState<"open" | "close" | null>(null);
    const [reason, setReason] = useState("");
    const [openTime, setOpenTime] = useState("10:30");
    const [closeTime, setCloseTime] = useState("18:00");
    const [until, setUntil] = useState(date);
    const [closeSessions, setCloseSessions] = useState(true);
    const [closeParties, setCloseParties] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // The staff override on this date, if any (to change or remove it)
    useEffect(() => {
        if (!day?.override_id) { setOverride(null); return; }
        fetch(`/api/booking-blocks`, { cache: "no-store" })
            .then(r => r.json())
            .then((blocks: Override[]) => {
                const found = Array.isArray(blocks) ? blocks.find(b => b.id === day.override_id) : undefined;
                if (!found) return;
                setOverride(found);
                setUntil(found.end_date);
                setReason(found.reason || "");
                if (found.type === "OPEN_TODAY") {
                    setMode("open");
                    if (found.open_time) setOpenTime(found.open_time.slice(0, 5));
                    if (found.close_time) setCloseTime(found.close_time.slice(0, 5));
                } else {
                    setMode("close");
                    setCloseSessions(found.blocks_normal_bookings);
                    setCloseParties(found.blocks_party_bookings);
                }
            })
            .catch(() => {});
    }, [day?.override_id]);

    useEffect(() => {
        if (day?.open && day?.close && !override) { setOpenTime(day.open); setCloseTime(day.close); }
    }, [day, override]);

    const save = async () => {
        setError("");
        if (until < date) { setError("The last day can't be before the first day."); return; }
        if (mode === "open" && openTime >= closeTime) { setError("Opening time must be before closing time."); return; }
        if (mode === "close" && !closeSessions && !closeParties) { setError("Choose what to close: play sessions, parties or both."); return; }
        if (mode === "close" && !reason.trim()) { setError("Please give a reason (customers see it on the booking calendar)."); return; }
        const body = mode === "open"
            ? { type: "OPEN_TODAY", reason: reason.trim() || "Special opening", open_time: openTime, close_time: closeTime,
                blocks_normal_bookings: false, blocks_party_bookings: false }
            : { type: "CLOSED", reason: reason.trim(), open_time: null, close_time: null,
                blocks_normal_bookings: closeSessions, blocks_party_bookings: closeParties };
        setSaving(true);
        try {
            const res = await fetch(override ? `/api/booking-blocks/${override.id}` : "/api/booking-blocks", {
                method: override ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...body, start_date: override ? override.start_date : date, end_date: until }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(Object.values(data).flat().join(" ") || "Could not save.");
            }
            onSaved();
            onClose();
        } catch (e: any) {
            setError(e?.message || "Could not save.");
        } finally {
            setSaving(false);
        }
    };

    const backToNormal = async () => {
        if (!override) return;
        const range = override.start_date === override.end_date ? "this date" : `${prettyDate(override.start_date)} – ${prettyDate(override.end_date)}`;
        if (!confirm(`Remove "${override.reason}" and go back to the normal opening for ${range}?`)) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/booking-blocks/${override.id}`, { method: "DELETE" });
            if (!res.ok && res.status !== 204) throw new Error("Could not remove the change.");
            onSaved();
            onClose();
        } catch (e: any) {
            setError(e?.message || "Could not remove the change.");
            setSaving(false);
        }
    };

    const status = !day ? "" : day.sessions_open
        ? `Open ${hoursText(day)}${day.parties_open ? "" : " · parties closed"}`
        : day.parties_open ? "Play sessions closed · parties open" : "Closed";
    const input = "px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm";

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" onClick={onClose}>
            <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()} role="dialog" aria-label={`Opening for ${date}`}>
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Opening for</p>
                        <h3 className="text-xl font-bold text-slate-900">{prettyDate(date)}</h3>
                        <p className={`mt-1 text-sm font-semibold ${day?.sessions_open ? "text-emerald-700" : "text-red-600"}`}>{status}</p>
                        {day?.reason && <p className="text-sm text-slate-500">{day.reason}</p>}
                        {bookingCount > 0 && (
                            <p className="mt-2 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                                {bookingCount} booking{bookingCount === 1 ? "" : "s"} on this date — <Link href={`/admin/calendar`} className="underline font-semibold">view in Calendar</Link>
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500" aria-label="Close"><X size={18} /></button>
                </div>

                <div className="p-5 space-y-5">
                    {override && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                            <p className="font-semibold text-slate-800">
                                Changed by staff: {override.type === "OPEN_TODAY" ? "special opening" : "closed"}
                                {override.start_date !== override.end_date && <> ({override.start_date} → {override.end_date})</>}
                            </p>
                            <button onClick={backToNormal} disabled={saving}
                                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-white disabled:opacity-50">
                                <RotateCcw size={14} /> Back to normal opening
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setMode("open")}
                            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-3 text-sm font-bold transition ${mode === "open" ? "border-sky-500 bg-sky-50 text-sky-800" : "border-slate-200 text-slate-600 hover:border-sky-300"}`}>
                            <CalendarCheck size={18} /> Open this date
                        </button>
                        <button onClick={() => setMode("close")}
                            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-3 text-sm font-bold transition ${mode === "close" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 hover:border-red-300"}`}>
                            <CalendarX size={18} /> Close this date
                        </button>
                    </div>

                    {mode && (
                        <div className="space-y-4">
                            {mode === "open" ? (
                                <>
                                    <p className="text-xs text-slate-500">Customers can book play sessions and parties on this date with these hours.</p>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-slate-700 w-24">Hours</label>
                                        <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className={input} aria-label="Opening time" />
                                        <span className="text-slate-400">to</span>
                                        <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className={input} aria-label="Closing time" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs text-slate-500">Online booking stops for what you tick. Existing bookings are not cancelled.</p>
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input type="checkbox" checked={closeSessions} onChange={e => setCloseSessions(e.target.checked)} /> Close play sessions
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input type="checkbox" checked={closeParties} onChange={e => setCloseParties(e.target.checked)} /> Close parties
                                    </label>
                                    {bookingCount > 0 && (
                                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                                            There {bookingCount === 1 ? "is 1 booking" : `are ${bookingCount} bookings`} on this date — contact those customers if you close.
                                        </p>
                                    )}
                                </>
                            )}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-700 w-24">Reason</label>
                                <input value={reason} onChange={e => setReason(e.target.value)} className={`${input} flex-1`}
                                    placeholder={mode === "open" ? "e.g. Inset day opening" : "e.g. Private hire"} maxLength={255} />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-700 w-24">Until</label>
                                <input type="date" value={until} min={override ? override.start_date : date} onChange={e => setUntil(e.target.value)} className={input} />
                                <span className="text-xs text-slate-400">(same date = one day)</span>
                            </div>
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <button onClick={save} disabled={saving}
                                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${mode === "open" ? "bg-sky-600 hover:bg-sky-700" : "bg-red-600 hover:bg-red-700"}`}>
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {override ? "Save changes" : mode === "open" ? "Open for bookings" : "Close for bookings"}
                            </button>
                        </div>
                    )}
                    {!mode && error && <p className="text-sm text-red-600">{error}</p>}
                </div>
            </div>
        </div>
    );
}

export default function OpeningDaysPage() {
    return (
        <Suspense fallback={<div className="p-8 text-slate-400">Loading…</div>}>
            <OpeningDays />
        </Suspense>
    );
}
