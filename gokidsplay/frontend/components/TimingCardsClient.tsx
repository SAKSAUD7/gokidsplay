"use client";

/**
 * TimingCardsClient — Dynamic Opening Hours Bar
 *
 * Priority order for today's status:
 *  1. Admin OPEN_TODAY / CLOSED_TODAY block from booking calendar (fetched async)
 *  2. Hard-coded school holiday / public holiday list (instant, no fetch needed)
 *  3. The CMS timing cards (e.g. "Wednesday to Sunday 10:00-17:30", "Monday & Tuesday Closed")
 *
 * The strip renders immediately using priority 2+3 so it never goes blank.
 * If an admin block overrides it, the strip updates silently once loaded.
 */

import { Clock } from "lucide-react";
import { isHolidayOpen, todayInUK, nowInUK, getOpeningHours, formatClock } from "@/lib/api/types";
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
    // 'open' | 'closed' from booking calendar, or null if not yet fetched / no block
    const [adminOverride, setAdminOverride] = useState<'open' | 'closed' | null>(null);

    // 1. Fetch static per-weekday CMS hours
    useEffect(() => {
        fetch('/api/timing-cards')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setSchedule(data.map((item: any) => {
                        // Labels may combine days ("Monday & Tuesday") or give a range
                        // ("Wednesday to Sunday") — match every day they cover
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
                        const dow = dows.length === 1 ? dows[0] : -1;
                        const closed = !item.open_time || item.open_time.toLowerCase() === "closed";
                        return {
                            dow,
                            dows,
                            label: item.day_label,
                            id: item.id,
                            open: closed ? null : item.open_time,
                            close: closed ? null : item.close_time,
                        };
                    }));
                }
            })
            .catch(() => {}); // fail silently — fallback handles it
    }, []);

    // 2. Fetch today's admin block from booking calendar (async, non-blocking)
    useEffect(() => {
        const todayStr = todayInUK();
        fetch('/api/bookings/site-alerts')
            .then(res => res.json())
            .then((alerts: any[]) => {
                if (!Array.isArray(alerts)) return;
                for (const alert of alerts) {
                    const start = (alert.start_date || '').split('T')[0];
                    const end   = (alert.end_date   || '').split('T')[0];
                    if (todayStr >= start && todayStr <= end) {
                        if (alert.type === 'OPEN_TODAY')   { setAdminOverride('open');   return; }
                        if (alert.type === 'CLOSED_TODAY') { setAdminOverride('closed'); return; }
                    }
                }
            })
            .catch(() => {}); // fail silently
    }, []);

    if (schedule.length === 0) return null; // wait only for the fast CMS fetch

    const today    = todayInUK();
    const todayDow = getUKDow();

    // Is today a school/bank holiday? (instant — uses hard-coded list)
    const isBankOrSchoolHoliday = isHolidayOpen(today);

    // Final open/closed decision for TODAY
    const isTodayOpen =
        adminOverride === 'open' ||                                 // admin explicitly opened
        (adminOverride !== 'closed' && isBankOrSchoolHoliday);     // holiday fallback

    const isTodayClosed = adminOverride === 'closed';

    const cards = schedule.map(day => {
        // A "School & Bank Holidays" card is today's card on a holiday
        const isHolidayCard = /holiday/i.test(day.label || '') && day.dows.length === 0;
        const isToday = isHolidayCard ? isBankOrSchoolHoliday : day.dows.includes(todayDow);

        let open  = day.open;
        let close = day.close;
        let holidayBadge = false;
        let adminOpenBadge = false;

        if (isToday) {
            if (isTodayClosed) {
                open = null; close = null;
            } else if (isTodayOpen && !open) {
                // A normally closed day that opens today (holiday or admin "open today")
                const hours = getOpeningHours(today) ?? { open: "10:00", close: "17:30" };
                open  = hours.open;
                close = hours.close;
                holidayBadge   = isBankOrSchoolHoliday && adminOverride !== 'open';
                adminOpenBadge = adminOverride === 'open';
            }
        }

        return { ...day, open, close, isToday, holidayBadge, adminOpenBadge };
    });

    // "17:30" -> "5.30pm"; anything else (e.g. "Late") is shown as typed
    const show = (t: string) => (/^\d{1,2}:\d{2}$/.test(t) ? formatClock(t.padStart(5, "0")) : t);

    return (
        <div className="relative z-20 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-y border-white/10 py-3 px-3">
            <div className="max-w-7xl mx-auto">
                <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-2 md:gap-4 min-w-max md:min-w-0 md:flex-wrap md:justify-center px-1">

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
