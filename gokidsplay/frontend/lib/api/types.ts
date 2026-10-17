import { z } from "zod";
import { isAfter, isBefore, startOfDay, addHours } from "date-fns";

/**
 * Returns the current date/time expressed in UK local time (Europe/London),
 * which correctly handles both GMT (winter) and BST (summer, UTC+1).
 * Use this INSTEAD of `new Date()` whenever you need to know what time it
 * currently is in Leicester.
 */
export function nowInUK(): Date {
    // Intl gives us the UK wall-clock time as a locale string;
    // we parse it back into a JS Date so arithmetic works normally.
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0');
    return new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
}

/**
 * Returns today's date string (YYYY-MM-DD) in UK local time.
 */
export function todayInUK(): string {
    const d = nowInUK();
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
    ].join('-');
}

// ─── Coventry City Council School Holiday Dates ─────────────────────────────
// Source: Coventry City Council "School term dates 2026-2027" (coventry.gov.uk/termdates),
// saved in the repo as 24_0866_NH_School_term_dates_calendar_2026_2027_*.pdf
// Yellow dates = school holidays (Go Kids Play is OPEN on these, including Mondays)
const SCHOOL_HOLIDAY_RANGES: Array<[string, string]> = [
    // 2025
    ["2025-05-26", "2025-05-30"], // Spring half-term
    ["2025-07-23", "2025-08-31"], // Summer holiday
    ["2025-10-20", "2025-10-24"], // Autumn half-term
    ["2025-12-20", "2026-01-04"], // Christmas & New Year
    // 2026 spring/summer
    ["2026-02-16", "2026-02-20"], // Spring half-term
    ["2026-03-30", "2026-04-10"], // Easter holidays
    ["2026-05-25", "2026-05-29"], // Summer half-term
    // 2026-27 school year (Coventry City Council calendar)
    ["2026-07-22", "2026-09-01"], // Summer holiday 2026 (to Aug 31) + Sep 1 LA training day
    ["2026-10-26", "2026-10-30"], // Autumn half-term (Oct 26 - 30)
    ["2026-12-21", "2027-01-01"], // Christmas & New Year (Dec 21 - Jan 1)
    ["2027-02-15", "2027-02-19"], // Spring half-term (Feb 15 - 19)
    ["2027-03-29", "2027-04-09"], // Easter holidays (Mar 29 - Apr 9; Good Friday Mar 26 is a bank holiday)
    ["2027-05-31", "2027-06-04"], // Summer half-term (May 31 bank holiday + Jun 1 - 4)
    ["2027-07-22", "2027-08-31"], // Summer holiday 2027 (Jul 22 - Aug 31)
];

// ─── UK Public Holidays (bank holidays on the council calendar) ──────────────
// Go Kids Play is OPEN on public holidays (including Mondays)
const UK_PUBLIC_HOLIDAYS: string[] = [
    // 2025-26
    "2025-12-25", "2025-12-26",
    "2026-01-01", // New Year's Day
    "2026-04-03", // Good Friday
    "2026-04-06", // Easter Monday
    "2026-05-04", // Early May Bank Holiday
    "2026-05-25", // Spring Bank Holiday
    "2026-08-31", // Summer Bank Holiday
    "2026-12-25", // Christmas Day
    "2026-12-28", // Boxing Day substitute
    // 2027
    "2027-01-01", // New Year's Day
    "2027-03-26", // Good Friday (Mar 26)
    "2027-03-29", // Easter Monday (Mar 29)
    "2027-05-03", // Early May Bank Holiday
    "2027-05-31", // Spring Bank Holiday
    "2027-08-30", // Summer Bank Holiday
];

/** Returns true if the given date (YYYY-MM-DD) is a UK public holiday. */
export function isPublicHoliday(date: string): boolean {
    return UK_PUBLIC_HOLIDAYS.includes(date);
}

/**
 * Returns true if the given date (YYYY-MM-DD) falls within a school holiday period.
 * Go Kids Play is OPEN on school holidays including Mondays.
 */
export function isSchoolHoliday(date: string): boolean {
    if (!date) return false;
    for (const [start, end] of SCHOOL_HOLIDAY_RANGES) {
        if (date >= start && date <= end) return true;
    }
    return false;
}

/** Returns true if Go Kids Play is open on this date (holidays override Monday closure). */
export function isHolidayOpen(date: string): boolean {
    return isSchoolHoliday(date) || isPublicHoliday(date);
}

export interface Stat {
    id: string;
    value: string;
    label: string;
    icon: string;
}

export interface GalleryItem {
    id: string;
    src: string;
    title: string;
    desc: string;
}

export interface Review {
    id: string;
    url: string;
    img: string;
}

export interface Activity {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    active: boolean;
    order: number;
}

// Phone number validation - accepts UK and international formats
const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

// Email validation (comprehensive)
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const bookingSchema = z.object({
    // Session Details
    date: z.string()
        .min(1, "Please select a date")
        // .refine((date) => {
        //     try {
        //         // Parse date string (yyyy-mm-dd) manually to ensure local time comparison
        //         const parts = date.split('-');
        //         if (parts.length !== 3) return false;
        //         const selectedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        //         const today = new Date();
        //         today.setHours(0, 0, 0, 0);
        //         return selectedDate >= today;
        //     } catch {
        //         return false;
        //     }
        // }, "Cannot book for past dates")
        .refine((date) => {
            try {
                const selectedDate = new Date(date);
                const maxDate = addHours(new Date(), 24 * 90); // 90 days in advance
                return isBefore(selectedDate, maxDate);
            } catch {
                return false;
            }
        }, "Bookings can only be made up to 90 days in advance"),

    time: z.string()
        .min(1, "Please select a time slot"),

    duration: z.enum(["60", "90", "120"]),

    // Guest Details
    adults: z.number()
        .min(0, "Cannot be negative")
        .max(50, "Maximum 50 adults per booking"),

    kids: z.number()
        .min(0, "Cannot be negative")
        .max(50, "Maximum 50 kids per booking"),

    spectators: z.number()
        .min(0, "Cannot be negative")
        .max(50, "Maximum 50 spectators per booking"),

    // Personal Details
    name: z.string()
        .min(3, "Name must be at least 3 characters")
        .max(100, "Name is too long")
        // Any alphabet (Zoë, José, Siobhán…), plus spaces, dots, hyphens and straight/curly apostrophes
        .regex(/^[\p{L}\p{M}\s.'’-]+$/u, "Name can only contain letters, spaces, dots, hyphens and apostrophes")
        .transform((name) => name.trim()),

    email: z.string()
        .min(1, "Email is required")
        .email("Please enter a valid email address")
        .regex(emailRegex, "Please enter a valid email address")
        .toLowerCase()
        .transform((email) => email.trim()),

    phone: z.string()
        .min(1, "Phone number is required")
        .regex(phoneRegex, "Please enter a valid phone number")
        .transform((phone) => phone.trim()),

    voucherCode: z.string().optional(),
    discountAmount: z.number().optional(),
}).refine((data) => {
    // At least one participant (adult or kid) must be selected
    return data.adults > 0 || data.kids > 0;
}, {
    message: "At least one participant (adult or kid) is required for booking",
    path: ["adults"]
}).refine((data) => {
    // Total guests should not exceed 100
    const totalGuests = data.adults + data.kids + data.spectators;
    return totalGuests <= 100;
}, {
    message: "Total guests cannot exceed 100 per booking",
    path: ["spectators"]
});

export type BookingFormData = z.infer<typeof bookingSchema>;

// Helper function to format phone number
export function formatPhoneNumber(phone: string): string {
    return phone.trim();
}

// Helper function to check if selected time is in the past — always uses UK time
export function isTimeInPast(date: string, time: string): boolean {
    if (!date || !time) return false;
    try {
        // Build a Date representing the booking time (no timezone offset — wall-clock time)
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        const bookingWallClock = new Date(year, month - 1, day, hours, minutes || 0, 0, 0);
        // Compare against the CURRENT UK wall-clock time
        const ukNow = nowInUK();
        return isBefore(bookingWallClock, ukNow);
    } catch {
        return false;
    }
}

// Helper to validate if a date is a valid booking date — uses UK today
export function isValidBookingDate(date: string): boolean {
    try {
        const [year, month, day] = date.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        const ukToday = nowInUK();
        const todayStart = new Date(ukToday.getFullYear(), ukToday.getMonth(), ukToday.getDate());
        const maxDate = new Date(todayStart.getTime() + 90 * 24 * 60 * 60 * 1000);
        return selectedDate >= todayStart && selectedDate <= maxDate;
    } catch {
        return false;
    }
}

// ─── Opening hours & session rules ──────────────────────────────────────────
// Editable in the admin portal (Website Content → Session Booking). The booking
// wizard loads them with applySessionRules(); until then these defaults — the
// same hours as the live site — are used. The Coventry school / bank holiday
// calendar above decides when the holiday hours apply (including Mon & Tue).

/** Opening and closing time as 24-hour "HH:MM". */
export interface DayHours { open: string; close: string }

export interface SessionRules {
    /** Weekly hours keyed by day number (0 = Sunday … 6 = Saturday); null = closed */
    opening_hours: Record<string, DayHours | null>;
    /** Hours on school & bank holidays; null = use the weekly hours */
    holiday_hours: DayHours | null;
    /** ANYTIME: visit for any session-length period; ARRIVAL: choose an arrival time */
    session_mode: "ANYTIME" | "ARRIVAL";
    arrival_interval_minutes: number;
    duration_minutes: number;
}

const LIVE_SITE_DAY: DayHours = { open: "10:00", close: "17:30" };

export const DEFAULT_SESSION_RULES: SessionRules = {
    opening_hours: { "0": LIVE_SITE_DAY, "1": null, "2": null, "3": LIVE_SITE_DAY, "4": LIVE_SITE_DAY, "5": LIVE_SITE_DAY, "6": LIVE_SITE_DAY },
    holiday_hours: LIVE_SITE_DAY,
    session_mode: "ANYTIME",
    arrival_interval_minutes: 30,
    duration_minutes: 120,
};

let sessionRules: SessionRules = DEFAULT_SESSION_RULES;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
function readHours(value: any): DayHours | null {
    if (value && HHMM.test(value.open) && HHMM.test(value.close) && value.open < value.close) {
        return { open: value.open, close: value.close };
    }
    return null;
}

/** Use the opening hours / session rules from the CMS Session Booking Configuration. */
export function applySessionRules(config: any): void {
    if (!config || typeof config !== "object") return;
    const weekly: Record<string, DayHours | null> = { ...DEFAULT_SESSION_RULES.opening_hours };
    if (config.opening_hours && typeof config.opening_hours === "object") {
        for (let d = 0; d < 7; d++) weekly[String(d)] = readHours(config.opening_hours[String(d)]);
    }
    sessionRules = {
        opening_hours: weekly,
        holiday_hours: config.holiday_hours === undefined ? DEFAULT_SESSION_RULES.holiday_hours : readHours(config.holiday_hours),
        session_mode: config.session_mode === "ARRIVAL" ? "ARRIVAL" : "ANYTIME",
        arrival_interval_minutes: Math.max(5, Number(config.arrival_interval_minutes) || DEFAULT_SESSION_RULES.arrival_interval_minutes),
        duration_minutes: Math.max(15, Number(config.duration_minutes) || DEFAULT_SESSION_RULES.duration_minutes),
    };
}

export function getSessionRules(): SessionRules {
    return sessionRules;
}

/** Kept for older callers: session length in hours. */
export const SESSION_LENGTH_HOURS = DEFAULT_SESSION_RULES.duration_minutes / 60;

const toMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
const fromMinutes = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

/** "17:30" → "5.30pm", "10:00" → "10am" (the style used on the Go Kids Play site). */
export function formatClock(t: string): string {
    const [h, m] = t.split(":").map(Number);
    const suffix = h >= 12 ? "pm" : "am";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return m ? `${h12}.${String(m).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}

/** Opening hours for a date (YYYY-MM-DD), or null when closed. */
export function getOpeningHours(date: string): DayHours | null {
    if (!date) return null;
    const weekly = sessionRules.opening_hours[String(new Date(date + "T12:00:00").getDay())] ?? null;
    if (isHolidayOpen(date)) return sessionRules.holiday_hours ?? weekly ?? LIVE_SITE_DAY;
    return weekly;
}

/** Minutes past midnight right now in the UK. */
function ukMinutesNow(): number {
    const now = nowInUK();
    return now.getHours() * 60 + now.getMinutes();
}

/**
 * Bookable session start times for a date.
 * Anytime mode: one entry (the opening time) meaning "any 2 hours while we're open";
 * bookable today until an hour before closing.
 * Arrival mode: every arrival interval that leaves a full session before closing;
 * today only times that haven't started yet.
 */
export function getAvailableTimeSlots(date: string, _activity?: string): string[] {
    const hours = getOpeningHours(date);
    if (!hours) return [];
    const open = toMinutes(hours.open);
    const close = toMinutes(hours.close);
    const isToday = date === todayInUK();
    const now = ukMinutesNow();

    if (sessionRules.session_mode === "ANYTIME") {
        if (isToday && now >= close - 60) return [];
        return [hours.open];
    }

    const slots: string[] = [];
    for (let t = open; t + sessionRules.duration_minutes <= close; t += sessionRules.arrival_interval_minutes) {
        if (!isToday || t > now) slots.push(fromMinutes(t));
    }
    return slots;
}

/** Party start times: on the hour, leaving a full party (default 2 hours) before closing. */
export function getPartyStartTimes(date: string, partyMinutes = 120): string[] {
    const hours = getOpeningHours(date);
    if (!hours) return [];
    const close = toMinutes(hours.close);
    const isToday = date === todayInUK();
    const now = ukMinutesNow();
    const slots: string[] = [];
    for (let t = Math.ceil(toMinutes(hours.open) / 60) * 60; t + partyMinutes <= close; t += 60) {
        if (!isToday || t > now) slots.push(fromMinutes(t));
    }
    return slots;
}
