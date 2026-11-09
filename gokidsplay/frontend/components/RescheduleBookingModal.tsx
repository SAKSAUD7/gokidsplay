"use client";

/**
 * My Account → Change date: the customer picks a new date and time for their session or party.
 * The server decides everything (which dates are open, which times have room, the 10-hour
 * cut-off, any party change fee) — see backend apps/bookings/reschedule.py.
 */

import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, Loader2, CalendarCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAccount } from "@/state/account/AccountContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

interface Options {
    allowed: boolean;
    reason: string;
    deadline: string | null;
    fee: number;
    changes_left: number;
    cutoff_hours: number;
    dates: string[];
}

interface TimeOption { time: string; available: boolean; current: boolean; spots_free: number | null }

const longDate = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
});
const deadlineText = (iso: string) => new Date(iso).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
});
const monthKey = (iso: string) => iso.slice(0, 7);

export function RescheduleBookingModal({
    bookingId, bookingType, currentDate, currentTime, onClose, onMoved,
}: {
    bookingId: number | string;
    bookingType: "SESSION" | "PARTY";
    currentDate: string;
    currentTime?: string | null;
    onClose: () => void;
    onMoved: (booking: any) => void;
}) {
    const { token } = useAccount();
    const base = `${API}/bookings/customer-auth/booking/${bookingType === "PARTY" ? "party" : "session"}/${bookingId}/reschedule/`;
    const [options, setOptions] = useState<Options | null>(null);
    const [loadError, setLoadError] = useState("");
    const [month, setMonth] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [times, setTimes] = useState<TimeOption[] | null>(null);
    const [time, setTime] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [moved, setMoved] = useState<any>(null);
    const [refresh, setRefresh] = useState(0);

    const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), [token]);

    useEffect(() => {
        if (!token) return;
        fetch(base, { headers, cache: "no-store" })
            .then(r => r.ok ? r.json() : Promise.reject(new Error(r.status === 401 ? "Please sign in again." : "Could not load the dates.")))
            .then((data: Options) => {
                setOptions(data);
                setMonth(monthKey(data.dates[0] || currentDate));
            })
            .catch(e => setLoadError(e.message));
    }, [base, headers, token, currentDate]);

    // Times for the chosen date
    useEffect(() => {
        if (!date) return;
        setTimes(null);
        setTime("");
        fetch(`${base}?date=${date}`, { headers, cache: "no-store" })
            .then(r => r.json())
            .then(data => setTimes(data.times || []))
            .catch(() => setTimes([]));
    }, [date, base, headers, refresh]);

    const open = useMemo(() => new Set(options?.dates || []), [options]);
    const months = useMemo(() => Array.from(new Set((options?.dates || []).map(monthKey))), [options]);

    const confirm = async () => {
        setSaving(true);
        setError("");
        try {
            const res = await fetch(base, { method: "POST", headers, body: JSON.stringify({ date, time }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "The date couldn't be changed. Please try again.");
                if (res.status === 409) setRefresh(n => n + 1);   // that time just filled up: show what's left
                return;
            }
            setMoved(data);
            onMoved(data);
        } catch {
            setError("Could not reach the server. Please check your connection and try again.");
        } finally {
            setSaving(false);
        }
    };

    // Month grid (Monday first)
    const grid = useMemo(() => {
        if (!month) return [];
        const [y, m] = month.split("-").map(Number);
        const first = new Date(Date.UTC(y, m - 1, 1));
        const lead = (first.getUTCDay() + 6) % 7;
        const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const cells: (string | null)[] = Array(lead).fill(null);
        for (let d = 1; d <= days; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
        return cells;
    }, [month]);
    const monthIndex = months.indexOf(month);
    const monthLabel = month ? new Date(month + "-01T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div role="dialog" aria-modal="true" aria-label="Change booking date"
                className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#0f0422] border border-white/10 rounded-3xl shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div>
                        <h2 className="text-white text-xl font-black">Change date</h2>
                        <p className="text-white/50 text-xs mt-0.5">
                            Now: {longDate(currentDate)}{currentTime ? ` at ${currentTime}` : ""}
                        </p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {moved ? (
                        <div className="text-center py-6">
                            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
                            <p className="text-white text-lg font-black">All done!</p>
                            <p className="text-white/60 text-sm mt-1">
                                Your booking is now on <strong className="text-white">{longDate(moved.date)}{moved.time ? ` at ${moved.time}` : ""}</strong>.
                                {" "}Your booking number stays the same, and we&apos;ve sent you an e-mail.
                            </p>
                            <button onClick={onClose} className="mt-6 px-6 py-3 bg-primary text-black font-black rounded-xl hover:bg-primary/90">
                                Close
                            </button>
                        </div>
                    ) : loadError ? (
                        <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle size={16} /> {loadError}</p>
                    ) : !options ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : !options.allowed ? (
                        <div className="text-center py-6">
                            <AlertCircle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                            <p className="text-white/80 text-sm">{options.reason}</p>
                            <a href="/contact" className="inline-block mt-5 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl">
                                Contact us
                            </a>
                        </div>
                    ) : (
                        <>
                            <div className="text-xs text-white/50 space-y-1">
                                {options.deadline && <p>You can change the date online until <strong className="text-white/80">{deadlineText(options.deadline)}</strong> ({options.cutoff_hours} hours before your booking).</p>}
                                <p>Same guests and price. {options.changes_left === 1 ? "This is your last online change for this booking." : `You can change it online ${options.changes_left} times.`}</p>
                            </div>
                            {options.fee > 0 && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-sm rounded-xl p-3">
                                    Your party is within 14 days, so a <strong>£{options.fee.toFixed(2)} change fee</strong> will be added to your balance.
                                </div>
                            )}

                            {/* 1. Date */}
                            <div>
                                <p className="text-white font-bold text-sm mb-2">1. Choose a new date</p>
                                {months.length === 0 ? (
                                    <p className="text-white/50 text-sm">There are no dates open for booking at the moment. Please contact us.</p>
                                ) : (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <button disabled={monthIndex <= 0} onClick={() => setMonth(months[monthIndex - 1])} aria-label="Previous month"
                                                className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-20"><ChevronLeft size={18} /></button>
                                            <span className="text-white font-bold text-sm">{monthLabel}</span>
                                            <button disabled={monthIndex >= months.length - 1} onClick={() => setMonth(months[monthIndex + 1])} aria-label="Next month"
                                                className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-20"><ChevronRight size={18} /></button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-white/40 font-bold mb-1">
                                            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {grid.map((iso, i) => {
                                                if (!iso) return <span key={i} />;
                                                const isOpen = open.has(iso);
                                                const chosen = iso === date;
                                                const current = iso === currentDate;
                                                return (
                                                    <button key={iso} disabled={!isOpen} onClick={() => setDate(iso)}
                                                        aria-label={longDate(iso)} aria-pressed={chosen}
                                                        className={`aspect-square rounded-lg text-sm font-bold transition-colors ${chosen ? "bg-primary text-black"
                                                            : isOpen ? "bg-white/10 text-white hover:bg-white/20" : "text-white/20"} ${current && !chosen ? "ring-1 ring-pink-400" : ""}`}>
                                                        {Number(iso.slice(8))}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] text-white/40 mt-2">Pink ring: your current date. Greyed-out days are closed.</p>
                                    </div>
                                )}
                            </div>

                            {/* 2. Time */}
                            {date && (
                                <div>
                                    <p className="text-white font-bold text-sm mb-2">2. Choose a time on {longDate(date)}</p>
                                    {times === null ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    ) : times.length === 0 ? (
                                        <p className="text-white/50 text-sm">No times left on this date. Please choose another date.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {times.map(t => (
                                                <button key={t.time} disabled={!t.available} onClick={() => setTime(t.time)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${time === t.time ? "bg-primary text-black border-primary"
                                                        : t.available ? "bg-white/5 text-white border-white/15 hover:bg-white/15" : "text-white/30 border-white/5 line-through"}`}>
                                                    {t.time}{t.current ? " (current)" : !t.available ? " full" : ""}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</p>}

                            {date && time && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <p className="text-white/50 text-xs">Your booking will move</p>
                                    <p className="text-white text-sm mt-1">
                                        from <strong>{longDate(currentDate)}{currentTime ? ` at ${currentTime}` : ""}</strong>
                                        <br />to <strong className="text-primary">{longDate(date)} at {time}</strong>
                                    </p>
                                    <button onClick={confirm} disabled={saving}
                                        className="w-full mt-4 bg-primary hover:bg-primary/90 text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarCheck className="w-5 h-5" />}
                                        {saving ? "Changing…" : options.fee > 0 ? `Confirm new date (+£${options.fee.toFixed(2)})` : "Confirm new date"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
