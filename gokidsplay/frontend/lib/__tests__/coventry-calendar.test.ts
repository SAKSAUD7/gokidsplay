/**
 * Booking calendar vs the Coventry City Council "School term dates 2026-2027"
 * (coventry.gov.uk/termdates). The dates below are typed independently from the
 * council's calendar so this test catches mistakes in lib/api/types.ts.
 *
 * Go Kids Play: Saturday & Sunday 10.30am–6pm; Monday–Friday only on school
 * holidays, bank holidays and the LA training day.
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import {
    applyCalendarDays, getAvailableTimeSlots, getClosedReason, getOpeningHours, getPartyHours,
    isHolidayOpen, isPublicHoliday, type CalendarDay,
} from "../api/types";
import { describeDays, fillHours, hoursPlaceholders } from "../hours-text";

const range = (from: string, to: string): string[] => {
    const out: string[] = [];
    for (let d = new Date(from + "T12:00:00Z"); d <= new Date(to + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
        out.push(d.toISOString().slice(0, 10));
    }
    return out;
};

// Council calendar 2026-27 — pink (holiday), black (bank holiday) and green (LA training day)
const BANK_HOLIDAYS = [
    "2026-08-31", // Summer bank holiday (end of 2025-26 year)
    "2026-12-25", "2026-12-28", "2027-01-01", // Christmas Day, Boxing Day (substitute), New Year
    "2027-03-26", "2027-03-29", // Good Friday, Easter Monday
    "2027-05-03", "2027-05-31", "2027-08-30", // May Day, Spring, Summer
];
const NO_SCHOOL = new Set<string>([
    ...BANK_HOLIDAYS,
    "2026-09-01", // LA set training day
    ...range("2026-10-26", "2026-10-30"), // Autumn half-term
    ...range("2026-12-21", "2027-01-01"), // Christmas holiday
    ...range("2027-02-15", "2027-02-19"), // Spring half-term
    ...range("2027-03-29", "2027-04-09"), // Easter holiday
    ...range("2027-05-31", "2027-06-04"), // Summer half-term
    ...range("2027-07-22", "2027-08-31"), // Summer holiday
]);

const SCHOOL_YEAR = range("2026-09-01", "2027-08-31");
const dow = (d: string) => new Date(d + "T12:00:00Z").getUTCDay(); // 0 = Sunday

describe("Coventry 2026-27 calendar", () => {
    it("knows every council bank holiday", () => {
        for (const d of BANK_HOLIDAYS) expect(isPublicHoliday(d), d).toBe(true);
    });

    it("treats every school holiday, bank holiday and the training day as a holiday", () => {
        for (const d of NO_SCHOOL) expect(isHolidayOpen(d), d).toBe(true);
    });

    it("has no extra holidays in term time", () => {
        const extra = SCHOOL_YEAR.filter(d => isHolidayOpen(d) && !NO_SCHOOL.has(d));
        expect(extra).toEqual([]);
    });

    it("opens Saturday & Sunday all year and Monday-Friday only when schools are off", () => {
        const wrong: string[] = [];
        for (const d of SCHOOL_YEAR) {
            const day = dow(d);
            const shouldOpen = day === 0 || day === 6 || NO_SCHOOL.has(d);
            const hours = getOpeningHours(d);
            if (!!hours !== shouldOpen) wrong.push(`${d} (${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]}) ${hours ? "open" : "closed"}`);
            if (hours && (hours.open !== "10:30" || hours.close !== "18:00")) wrong.push(`${d} hours ${hours.open}-${hours.close}`);
        }
        expect(wrong).toEqual([]);
    });

    it("offers the 2-hour anytime session on open days and nothing on closed days", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-08-01T09:00:00Z")); // before the school year, so no same-day cut-off
        expect(getAvailableTimeSlots("2026-10-26")).toEqual(["10:30"]); // half-term Monday
        expect(getAvailableTimeSlots("2026-11-02")).toEqual([]);        // term-time Monday
        expect(getAvailableTimeSlots("2026-11-04")).toEqual([]);        // term-time Wednesday
        expect(getAvailableTimeSlots("2026-11-06")).toEqual([]);        // term-time Friday
        expect(getAvailableTimeSlots("2026-11-07")).toEqual(["10:30"]); // Saturday
        expect(getAvailableTimeSlots("2027-03-29")).toEqual(["10:30"]); // Easter Monday
    });

    afterEach(() => vi.useRealTimers());
});

const day = (date: string, extra: Partial<CalendarDay>): CalendarDay => ({
    date, sessions_open: true, parties_open: true, open: "10:30", close: "18:00",
    source: "weekly", reason: "", override_id: null, override_type: null, ...extra,
});

describe("Admin Opening Days (server calendar)", () => {
    it("opens a term-time weekday the admin has opened, with its own hours", () => {
        applyCalendarDays([day("2026-11-11", { source: "special_opening", reason: "Inset day", open: "12:00", close: "17:00", override_id: 1 })]);
        expect(getOpeningHours("2026-11-11")).toEqual({ open: "12:00", close: "17:00" });
        expect(getClosedReason("2026-11-11")).toBeNull();
    });

    it("closes a Saturday the admin has closed, with the reason", () => {
        applyCalendarDays([day("2026-11-14", { sessions_open: false, parties_open: false, source: "closure", reason: "Private hire", override_id: 2 })]);
        expect(getOpeningHours("2026-11-14")).toBeNull();
        expect(getClosedReason("2026-11-14")).toBe("Private hire");
        expect(getClosedReason("2026-11-14", "party")).toBe("Private hire");
    });

    it("can close parties only", () => {
        applyCalendarDays([day("2026-11-21", { parties_open: false, source: "closure", reason: "Party room repairs" })]);
        expect(getOpeningHours("2026-11-21")).toEqual({ open: "10:30", close: "18:00" });
        expect(getPartyHours("2026-11-21")).toBeNull();
    });
});

describe("Opening-hours placeholders in website text", () => {
    it("describes the open days", () => {
        expect(describeDays([6, 0])).toBe("Saturday & Sunday");
        expect(describeDays([3, 4, 5, 6, 0])).toBe("Wednesday to Sunday");
        expect(describeDays([1, 2, 3, 4, 5])).toBe("Monday to Friday");
    });

    it("fills {days}, {hours}, {open}, {close} and {closed_days}", () => {
        const values = hoursPlaceholders();
        expect(fillHours("Open {days} {hours}", values)).toBe("Open Saturday & Sunday 10.30am – 6pm");
        expect(fillHours({ a: ["We close at {close}"], b: "{closed_days}: closed" }, values))
            .toEqual({ a: ["We close at 6pm"], b: "Monday to Friday: closed" });
    });
});
