/**
 * Admin booking search: name, email, phone (with or without spaces), birthday
 * child, id, date ("24/10", "2026-10-24") — and the booking number typed any
 * way staff might ("GK482913", "gk 482 913", "#GK482913").
 * Same rules as the server search (backend apps/core/search_service.py).
 */
const compact = (value: unknown) => String(value ?? "").toLowerCase().replace(/[\s#-]/g, "");
const digitsOf = (value: unknown) => String(value ?? "").replace(/\D/g, "");

/** "24/10", "24/10/2026", "2026-10-24" → "2026-10-24" (UK day/month order) */
export function searchDate(term: string): string | null {
    const t = term.trim();
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = t.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/);
    if (!m) return null;
    const year = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : String(new Date().getFullYear());
    return `${year}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

export function matchesBookingSearch(booking: any, term: string): boolean {
    const q = term.trim().toLowerCase();
    if (!q) return true;
    const ref = compact(q);
    const digits = digitsOf(q);
    const day = searchDate(q);
    const text = [
        booking.customerName, booking.customerEmail, booking.name, booking.email, booking.phone,
        booking.customer?.name, booking.customer?.email, booking.customer?.phone, booking.birthday_child_name,
    ];
    const phones = [booking.phone, booking.customer?.phone].map(digitsOf);
    return (
        (!!ref && compact(booking.booking_number).includes(ref)) ||
        text.some(v => typeof v === "string" && v.toLowerCase().includes(q)) ||
        (digits.length >= 6 && phones.some(p => p.includes(digits.slice(-6)))) ||
        (!!day && String(booking.date || "").startsWith(day)) ||
        String(booking.id ?? "") === q.replace(/^#/, "")
    );
}
