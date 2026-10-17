/**
 * Opening-hours placeholders for website text.
 *
 * Text edited in the admin portal (booking information, page sections, timing
 * cards, the booking notice…) can say "Open {days} {hours}" instead of typing
 * the times, and the website fills them in from Website Content → Session
 * Booking. Change the hours there and every page follows.
 *
 *   {open} 10.30am · {close} 6pm · {hours} 10.30am – 6pm
 *   {days} Saturday & Sunday (the days open every week)
 *   {closed_days} Monday to Friday (open only on school & bank holidays)
 *   {holiday_open} · {holiday_close} · {holiday_hours} (school & bank holiday hours)
 */
import { DEFAULT_SESSION_RULES, formatClock, readSessionRules, type DayHours, type SessionRules } from "./api/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first

/** [6, 0] → "Saturday & Sunday"; [3, 4, 5, 6, 0] → "Wednesday to Sunday". */
export function describeDays(days: number[]): string {
    const open = new Set(days);
    if (open.size === 0) return "";
    if (open.size === 7) return "Every day";
    const runs: number[][] = [];
    for (const d of WEEK) {
        if (!open.has(d)) continue;
        const last = runs[runs.length - 1];
        if (last && WEEK.indexOf(last[last.length - 1]) === WEEK.indexOf(d) - 1) last.push(d);
        else runs.push([d]);
    }
    const parts = runs.flatMap(r => r.length >= 3 ? [`${DAY_NAMES[r[0]]} to ${DAY_NAMES[r[r.length - 1]]}`] : r.map(d => DAY_NAMES[d]));
    return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} & ${parts[parts.length - 1]}`;
}

const range = (h: DayHours) => `${formatClock(h.open)} – ${formatClock(h.close)}`;

export function hoursPlaceholders(rules: SessionRules = DEFAULT_SESSION_RULES): Record<string, string> {
    const openDays = WEEK.filter(d => rules.opening_hours[String(d)]);
    const closedDays = WEEK.filter(d => !rules.opening_hours[String(d)]);
    const holiday = rules.holiday_hours ?? rules.opening_hours[String(openDays[0])] ?? DEFAULT_SESSION_RULES.holiday_hours!;
    const weekly = rules.opening_hours[String(openDays[0])] ?? holiday;
    return {
        open: formatClock(weekly.open),
        close: formatClock(weekly.close),
        hours: range(weekly),
        days: describeDays(openDays) || "School & bank holidays",
        closed_days: describeDays(closedDays),
        holiday_open: formatClock(holiday.open),
        holiday_close: formatClock(holiday.close),
        holiday_hours: range(holiday),
    };
}

const PLACEHOLDER = /\{(open|close|hours|days|closed_days|holiday_open|holiday_close|holiday_hours)\}/g;

/** Fill the placeholders in a string, or in every string inside an object / array. */
export function fillHours<T>(value: T, values: Record<string, string>): T {
    if (typeof value === "string") return value.replace(PLACEHOLDER, (_, key) => values[key] ?? "") as T;
    if (Array.isArray(value)) return value.map(v => fillHours(v, values)) as T;
    if (value && typeof value === "object") {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) out[k] = fillHours(v, values);
        return out as T;
    }
    return value;
}

/** schema.org openingHoursSpecification for the weekly hours (days with the same hours grouped). */
export function openingHoursSpecification(rules: SessionRules = DEFAULT_SESSION_RULES) {
    const groups = new Map<string, string[]>();
    for (const d of WEEK) {
        const h = rules.opening_hours[String(d)];
        if (!h) continue;
        const key = `${h.open}-${h.close}`;
        groups.set(key, [...(groups.get(key) ?? []), DAY_NAMES[d]]);
    }
    return Array.from(groups, ([key, days]) => {
        const [opens, closes] = key.split("-");
        return { "@type": "OpeningHoursSpecification", dayOfWeek: days, opens, closes };
    });
}

/** Placeholder values from a Session Booking Configuration object (or the defaults). */
export function hoursPlaceholdersFromConfig(config: any): Record<string, string> {
    return hoursPlaceholders(readSessionRules(config));
}
