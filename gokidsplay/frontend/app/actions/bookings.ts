"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

function transformBooking(b: any) {
    if (!b) return null;
    return {
        ...b,
        bookingStatus: b.booking_status,
        waiverStatus: b.waiver_status,
        paymentStatus: b.payment_status,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
        voucherCode: b.voucher_code,
        discountAmount: b.discount_amount,
        // Map fields that might be missing or different in party bookings
        qrCode: b.qr_code,
        duration: b.duration || 120,
        spectators: b.spectators || 0,
        customer: b.customer_details ? transformCustomer(b.customer_details) : null,
        waivers: b.waivers?.map(transformWaiver) || [],
        transactions: b.transactions || []
    };
}

function transformCustomer(c: any) {
    if (!c) return null;
    return {
        ...c,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        _count: c._count || { bookings: 0 }
    };
}

function transformWaiver(w: any) {
    if (!w) return null;
    return {
        ...w,
        signedAt: w.signed_at,
        fileUrl: w.file_url,
        emergencyContact: w.emergency_contact,
        booking: w.booking_details ? transformBooking(w.booking_details) : null
    };
}

export async function getTicket(uuid: string) {
    // Try fetching from regular bookings
    let res = await fetch(`${API_URL}/bookings/bookings/ticket/${uuid}/`, {
        cache: "no-store",
    });

    if (res.ok) {
        const data = await res.json();
        return transformBooking(data);
    }

    // If not found, try fetching from party bookings
    res = await fetch(`${API_URL}/bookings/party-bookings/ticket/${uuid}/`, {
        cache: "no-store",
    });

    if (res.ok) {
        const data = await res.json();
        return transformBooking(data);
    }

    return null;
}
