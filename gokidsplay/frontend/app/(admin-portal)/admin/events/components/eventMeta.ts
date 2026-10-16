// Shared labels, colours and helpers for the admin Special Events pages.

export const EVENT_TYPES = [
    { value: "BIRTHDAY", label: "Birthday Party", emoji: "🎂", color: "#EC4899" },
    { value: "CHRISTMAS", label: "Christmas Party", emoji: "🎄", color: "#16A34A" },
    { value: "PAJAMA", label: "Pajama Party", emoji: "🌙", color: "#6366F1" },
    { value: "HALLOWEEN", label: "Halloween Party", emoji: "🎃", color: "#F97316" },
    { value: "EASTER", label: "Easter Party", emoji: "🐣", color: "#84CC16" },
    { value: "SCHOOL_HOLIDAY", label: "School Holiday Event", emoji: "📚", color: "#0EA5E9" },
    { value: "SUMMER", label: "Summer Event", emoji: "☀️", color: "#EAB308" },
    { value: "SPECIAL", label: "Special Event", emoji: "✨", color: "#8B5CF6" },
    { value: "CUSTOM", label: "Custom Event", emoji: "🎯", color: "#6B7280" },
];

export const typeInfo = (value: string) => EVENT_TYPES.find(t => t.value === value) ?? EVENT_TYPES[EVENT_TYPES.length - 1];

/** Tailwind badge classes for event statuses */
export const EVENT_STATUS: Record<string, { label: string; badge: string }> = {
    DRAFT: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
    PUBLISHED: { label: "Published", badge: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Cancelled", badge: "bg-red-100 text-red-700" },
    COMPLETED: { label: "Completed", badge: "bg-indigo-100 text-indigo-700" },
    SOLD_OUT: { label: "Sold Out", badge: "bg-amber-100 text-amber-700" },
};

/** Reservation statuses (payment is taken at the venue) */
export const RESERVATION_STATUS: Record<string, { label: string; badge: string }> = {
    PENDING: { label: "Pending", badge: "bg-amber-100 text-amber-700" },
    CONFIRMED: { label: "Reserved", badge: "bg-emerald-100 text-emerald-700" },
    COMPLETED: { label: "Completed", badge: "bg-indigo-100 text-indigo-700" },
    NO_SHOW: { label: "No-show", badge: "bg-slate-200 text-slate-600" },
    CANCELLED: { label: "Cancelled", badge: "bg-red-100 text-red-700" },
    REFUNDED: { label: "Refunded", badge: "bg-pink-100 text-pink-700" },
};

export const PAYMENT_STATUS: Record<string, { label: string; badge: string }> = {
    PENDING: { label: "Pay at venue", badge: "bg-amber-50 text-amber-700 border border-amber-200" },
    DEPOSIT_PAID: { label: "Deposit paid", badge: "bg-sky-50 text-sky-700 border border-sky-200" },
    FULLY_PAID: { label: "Paid", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    REFUNDED: { label: "Refunded", badge: "bg-pink-50 text-pink-700 border border-pink-200" },
    FAILED: { label: "Failed", badge: "bg-red-50 text-red-700 border border-red-200" },
};

/** Statuses of customers' "organise an event for me" requests */
export const REQUEST_STATUS: Record<string, { label: string; badge: string }> = {
    NEW: { label: "New", badge: "bg-blue-100 text-blue-700" },
    CONTACTED: { label: "Contacted", badge: "bg-violet-100 text-violet-700" },
    QUOTED: { label: "Quote sent", badge: "bg-amber-100 text-amber-700" },
    CONFIRMED: { label: "Confirmed", badge: "bg-emerald-100 text-emerald-700" },
    DECLINED: { label: "Declined", badge: "bg-slate-200 text-slate-600" },
    CANCELLED: { label: "Cancelled by customer", badge: "bg-red-100 text-red-700" },
};

export const money = (v: any) => `£${(parseFloat(v) || 0).toFixed(2)}`;

export const longDate = (d?: string | null) =>
    d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—";

export const shortTime = (t?: string | null) => (t ? t.slice(0, 5) : "");

/** Today as YYYY-MM-DD in UK time (events are dated in UK time) */
export const todayUK = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
