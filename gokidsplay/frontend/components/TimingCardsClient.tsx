"use client";

/**
 * TimingCardsClient — Dynamic Opening Hours Bar
 *
 *  - The cards come from Website Content → Timing Cards; their {open}, {close},
 *    {days}… placeholders are filled from the Session Booking opening hours.
 *  - Today's card is highlighted from the opening calendar, which includes the
 *    Coventry school / bank holidays and the admin's Opening Days (special
 *    openings and closures).
 *
 * The strip renders from the standard hours straight away and updates once the
 * calendar for today has loaded.
 */

import { Clock } from "lucide-react";
import { isHolidayOpen, todayInUK, nowInUK, getOpeningHours, formatClock, type CalendarDay } from "@/lib/api/types";
import { fetchOpeningCalendar } from "@/lib/api/opening-calendar";
import { useEffect, useState } from "react";

const DAY_NAME_TO_DOW: Record<string, number> = {
    Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0,
};

function getUKDow(): number {
    return nowInUK().getDay(); // 0=Sun, 1=Mon … 6=Sat, in UK timezone
}

export function TimingCardsClient() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [todayStatus, setTodayStatus] = useState<CalendarDay | null>(null);

    // 1. The timing cards (placeholders already filled by /api/timing-cards)
    useEffect(() => {
        fetch('/api/timing-cards')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setSchedule(data.map((item: any) => {
                        // Labels may combine days ("Saturday & Sunday") or give a range
                        // ("Monday to Friday") — match every day they cover
                        const label: string = item.day_label || '';
                        const range = label.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*(?:to|–|-)\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/);
                        let dows = Object.entries(DAY_NAME_TO_DOW)
                            .filter(([name]) => label.includes(name))
                            .map(([, d]) => d);
                        if (range) {
                            dows = [];
                            for (let d = DAY_NAME_TO_DOW[range[1]]; ; d = (d + 1) % 7) {
                                dows.push(d);
                                if (d === DAY_NAME_TO_DOW[range[2]]) break;
                            }
                        }
                        const closed = !item.open_time || item.open_time.toLowerCase() === "closed";
                        return {
                            dows,
                            label: item.day_label,
                            id: item.id,
                            open: closed ? null : item.open_time,
                            close: closed ? null : item.close_time,
                        };
                    }));
                }
            })
            .catch(() => {}); // fail silently — the strip just stays hidden
    }, []);

    // 2. Today's opening status (holidays + admin special openings / closures)
    useEffect(() => {
        const today = todayInUK();
        fetchOpeningCalendar(today, today)
            .then(days => setTodayStatus(days.find(d => d.date === today) ?? null))
            .catch(() => {}); // fail silently — standard hours are shown
    }, []);

    if (schedule.length === 0) return null; // wait only for the fast CMS fetch

    const today = todayInUK();
    const todayDow = getUKDow();
    const fallbackHours = getOpeningHours(today);
    const isTodayOpen = todayStatus ? todayStatus.sessions_open : !!fallbackHours;
    const todayHours = todayStatus
        ? (todayStatus.open && todayStatus.close ? { open: todayStatus.open, close: todayStatus.close } : null)
        : fallbackHours;
    const holidayToday = todayStatus
        ? ["school_holiday", "bank_holiday"].includes(todayStatus.source)
        : isHolidayOpen(today);
    const specialOpening = todayStatus?.source === "special_opening";

    const isHolidayCard = (day: any) => /holiday/i.test(day.label || '') && day.dows.length === 0;
    const hasHolidayCard = schedule.some(isHolidayCard);

    const cards = schedule.map(day => {
        // On a school / bank holiday the "School & Bank Holidays" card is today's card
        const isToday = isHolidayCard(day)
            ? holidayToday && !specialOpening
            : day.dows.includes(todayDow) && !(holidayToday && hasHolidayCard && !specialOpening);

        let open = day.open;
        let close = day.close;
        let holidayBadge = false;
        let adminOpenBadge = false;

        if (isToday) {
            if (!isTodayOpen || !todayHours) {
                open = null; close = null;
            } else {
                // Today's real hours (a special opening may have its own)
                open = todayHours.open;
                close = todayHours.close;
                holidayBadge = holidayToday && !day.open;
                adminOpenBadge = specialOpening;
            }
        }

        return { ...day, open, close, isToday, holidayBadge, adminOpenBadge };
    });

    // "18:00" -> "6pm"; anything else (e.g. "10.30am", "Late") is shown as typed
    const show = (t: string) => (/^\d{1,2}:\d{2}$/.test(t) ? formatClock(t.padStart(5, "0")) : t);

    return (
        <div className="relative z-20 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-y border-white/10 py-3 px-3">
            <div className="max-w-7xl mx-auto">
                <div>
                    {/* Wraps onto two lines on a phone instead of running off the screen */}
                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 px-1">

                        <div className="flex items-center gap-1.5 text-white/60 text-xs font-semibold uppercase tracking-widest shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Opening Hours</span>
                            <span className="xs:hidden">Hours</span>
                        </div>

                        <div className="w-px h-4 bg-white/20 shrink-0" />

                        {cards.map(card => {
                            const isClosed = !card.open;

                            const cardBorder = card.isToday
                                ? isClosed
                                    ? "border-red-500/50 bg-red-500/10"
                                    : "border-primary/60 bg-primary/10"
                                : "border-white/10 bg-white/5";

                            const labelClass = card.isToday
                                ? "text-white font-bold"
                                : "text-white/70 font-semibold";

                            const badgeClass = isClosed
                                ? "bg-red-500/20 text-red-300"
                                : card.isToday
                                    ? "bg-primary/30 text-primary font-black"
                                    : "bg-white/10 text-white/60 font-bold";

                            return (
                                <div
                                    key={`${card.label}-${card.id ?? ''}`}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${cardBorder} backdrop-blur-sm shrink-0 transition-all`}
                                >
                                    <span className={`text-xs whitespace-nowrap ${labelClass}`}>
                                        {card.label}
                                        {card.isToday && (
                                            <span className="ml-1 text-[9px] opacity-50 font-normal">(today)</span>
                                        )}
                                        {card.adminOpenBadge && (
                                            <span className="ml-1 text-[9px] text-emerald-400 font-bold">OPEN</span>
                                        )}
                                        {card.holidayBadge && (
                                            <span className="ml-1 text-[9px] text-emerald-400 font-bold">HOLIDAY</span>
                                        )}
                                    </span>

                                    <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${badgeClass}`}>
                                        {isClosed ? "CLOSED" : `${show(card.open)} – ${show(card.close)}`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
