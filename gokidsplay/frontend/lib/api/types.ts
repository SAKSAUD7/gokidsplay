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

// ─── Leicester City Council School Holiday Dates 2025–2027 ──────────────────
// Source: Leicester City Council 2026-27 official calendar
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
    // 2026-27 council year (from official LCC 2026-27 calendar)
    ["2026-07-22", "2026-08-21"], // Summer holiday 2026 ends Aug 21
    ["2026-10-19", "2026-10-23"], // Autumn half-term (Oct 19 - 23)
    ["2026-12-21", "2027-01-01"], // Christmas & New Year (Dec 21 - Jan 1)
    ["2027-02-15", "2027-02-19"], // Spring half-term (Feb 15 - 19)
    ["2027-03-22", "2027-04-02"], // Easter holidays (Mar 22 - Apr 2)
    ["2027-05-31", "2027-06-04"], // Summer half-term
    ["2027-07-12", "2027-08-20"], // Summer holiday 2027 (Starts July 12)
];

// ─── UK Public Holidays (Red dates on LCC calendar) ──────────────────────────
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
        .regex(/^[a-zA-Z\s.'-]+$/, "Name can only contain letters, spaces, dots, hyphens and apostrophes")
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

    // Waiver Details
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    dateOfArrival: z.string().min(1, "Date of arrival is required"),
    minors: z.array(z.object({
        name: z.string().min(1, "Minor name is required"),
        dob: z.string().min(1, "Minor DOB is required")
    })).optional(),
    adultGuests: z.array(z.object({
        name: z.string().min(1, "Name is required"),
        dob: z.string().min(1, "DOB is required")
    })).optional(),
    voucherCode: z.string().optional(),
    discountAmount: z.number().optional(),

    // Waiver
    waiverAccepted: z.boolean()
        .refine((val) => val === true, "You must accept the waiver to proceed")
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

// Get available time slots for Go Kids Play opening hours:
//
// EVERY DAY EXCEPT SAT:  12:00 / 14:00 – 22:00 (10 pm)
// SATURDAY:   12:00 – 23:00 (11 pm)
// MONDAY:     CLOSED — except school holidays & public holidays (OPEN)
//
// ROLLER SKATING — 60-min slot intervals (multiple sessions on rink simultaneously)
// TEN PIN BOWLING — 90-min slot intervals (lane turnover time)
export function getAvailableTimeSlots(date: string, activity?: string): string[] {
    const selectedDate = new Date(date + 'T12:00:00');
    const dayOfWeek = selectedDate.getDay(); // 0=Sun, 1=Mon, 2=Tue...

    // Monday is CLOSED unless it's a school holiday or public holiday
    if (dayOfWeek === 1 && !isHolidayOpen(date)) return [];

    const isBowling = activity === 'ten-pin-bowling';
    const isSaturday = dayOfWeek === 6;
    let allSlots: string[];

    const isHoliday = isHolidayOpen(date);

    if (isBowling) {
        // 90-min intervals
        if (isSaturday || dayOfWeek === 0 || isHoliday) {
            allSlots = ["12:00", "13:30", "15:00", "16:30", "18:00", "19:30", "21:00"];
        } else {
            allSlots = ["14:00", "15:30", "17:00", "18:30", "20:00"];
        }
    } else {
        // Skating: hourly slots
        if (isSaturday) {
            allSlots = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
        } else if (dayOfWeek === 0 || isHoliday) {
            allSlots = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
        } else {
            allSlots = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
        }
    }

    // For today's date, only show slots that are at least 2 hours from now (UK time)
    const ukNow = nowInUK();
    const ukTodayStr = todayInUK();
    if (date === ukTodayStr) {
        const currentHour = ukNow.getHours();
        const currentMinute = ukNow.getMinutes();
        // Require at least 2 full hours ahead; if we're mid-hour, round up to 3h
        const minSlotHour = currentMinute > 0 ? currentHour + 3 : currentHour + 2;
        return allSlots.filter(slot => {
            const [slotHour, slotMin] = slot.split(':').map(Number);
            const slotTotalMins = slotHour * 60 + slotMin;
            return slotTotalMins >= minSlotHour * 60;
        });
    }
    return allSlots;
}
