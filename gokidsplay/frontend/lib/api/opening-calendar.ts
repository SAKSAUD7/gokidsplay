import { applyCalendarDays, todayInUK, type CalendarDay } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

function addDays(ymd: string, days: number): string {
    const d = new Date(ymd + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

/** Opening status for every date from start to end (YYYY-MM-DD, inclusive). */
export async function fetchOpeningCalendar(start: string, end: string): Promise<CalendarDay[]> {
    const res = await fetch(`${API_URL}/bookings/public/calendar/?start=${start}&end=${end}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Opening calendar failed (${res.status})`);
    return res.json();
}

/**
 * Load the opening calendar (today + `days`) for the booking wizards, including
 * the admin's special openings and closures. If it can't be loaded the wizards
 * keep using the weekly hours and the council calendar.
 */
export async function loadOpeningCalendar(days = 120): Promise<boolean> {
    try {
        const today = todayInUK();
        applyCalendarDays(await fetchOpeningCalendar(today, addDays(today, days)));
        return true;
    } catch (error) {
        console.warn("Opening calendar unavailable — using the standard opening hours:", error);
        return false;
    }
}
