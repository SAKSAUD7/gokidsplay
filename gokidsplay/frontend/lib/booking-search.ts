/**
 * Admin booking search: name, email, phone, birthday child, id — and the booking
 * number typed any way staff might ("GK482913", "gk 482 913", "#GK482913").
 */
const compact = (value: unknown) => String(value ?? "").toLowerCase().replace(/[\s#-]/g, "");

export function matchesBookingSearch(booking: any, term: string): boolean {
    const q = term.trim().toLowerCase();
    if (!q) return true;
    const ref = compact(q);
    const text = [
        booking.customerName, booking.customerEmail, booking.name, booking.email, booking.phone,
        booking.customer?.name, booking.customer?.email, booking.customer?.phone, booking.birthday_child_name,
    ];
    return (
        (!!ref && compact(booking.booking_number).includes(ref)) ||
        text.some(v => typeof v === "string" && v.toLowerCase().includes(q)) ||
        String(booking.id ?? "") === q.replace(/^#/, "")
    );
}
