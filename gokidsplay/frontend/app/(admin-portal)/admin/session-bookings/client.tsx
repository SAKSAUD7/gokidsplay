"use client";

import { BookingTable } from "../components/BookingTable";
import { useState } from "react";

interface SessionBookingsClientProps {
    initialBookings: any[];
}

export function SessionBookingsClient({ initialBookings }: SessionBookingsClientProps) {
    const [bookings] = useState(initialBookings);

    return (
        <div className="space-y-6">
            <BookingTable
                bookings={bookings}
                title="Session Bookings"
                type="session"
            />
        </div>
    );
}
