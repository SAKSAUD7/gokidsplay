import { z } from "zod";
import { isAfter, isBefore, startOfDay, addHours } from "date-fns";

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
        // Any alphabet (Zoë, José, Siobhán…), digits, spaces and . ' ’ - & ( ) — e.g. "Sam & Alex"
        .regex(/^[\p{L}\p{M}\p{N}\s.'’&()-]+$/u, "Name can only contain letters, numbers, spaces and . ' - & ( )")
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
        .transform((phone) => formatPhoneNumber(phone)),

    // Waiver Details
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    dateOfArrival: z.string().min(1, "Date of arrival is required"),
    minors: z.array(z.object({
        name: z.string().min(1, "Minor name is required"),
        dob: z.string().min(1, "Minor DOB is required")
    })).optional(),
    adultGuests: z.array(z.object({
        name: z.string().min(1, "Adult name is required"),
        email: z.string().email("Valid email required").optional(),
        phone: z.string().min(10, "Valid phone required").optional(),
        dob: z.string().min(1, "Adult DOB is required")
    })).optional(),
    voucherCode: z.string().optional(),
    discountAmount: z.number().optional(),

    // Waiver
    waiverAccepted: z.boolean()
        .refine((val) => val === true, "You must accept the waiver to proceed")
}).refine((data) => {
    // At least one jumper (adult or kid) must be selected
    return data.adults > 0 || data.kids > 0;
}, {
    message: "At least one jumper (adult or kid) is required for booking",
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

// Helper function to check if selected time is in the past
export function isTimeInPast(date: string, time: string): boolean {
    if (!date || !time) return false;
    try {
        const selectedDate = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
        selectedDate.setHours(hours, minutes || 0, 0, 0);
        const now = new Date();
        return isBefore(selectedDate, now);
    } catch {
        return false;
    }
}

// Helper to validate if a date is a valid booking date
export function isValidBookingDate(date: string): boolean {
    try {
        const selectedDate = new Date(date);
        const today = startOfDay(new Date());
        const maxDate = addHours(new Date(), 24 * 90);
        return (isAfter(selectedDate, today) || selectedDate.getTime() === today.getTime())
            && isBefore(selectedDate, maxDate);
    } catch {
        return false;
    }
}

// Get available time slots for a given date
export function getAvailableTimeSlots(date: string): string[] {
    const allSlots = [
        "10:00", "11:00", "12:00", "13:00", "14:00",
        "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
    ];
    const selectedDate = new Date(date);
    const today = new Date();
    if (selectedDate.toDateString() === today.toDateString()) {
        const currentHour = today.getHours();
        return allSlots.filter(slot => {
            const [slotHour] = slot.split(':').map(Number);
            return slotHour > currentHour;
        });
    }
    return allSlots;
}
