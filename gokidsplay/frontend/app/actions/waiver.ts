"use server";

import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export async function submitWaiver(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const emergencyContact = formData.get("emergencyContact") as string;
    const bookingId = formData.get("bookingId") as string; // Optional

    if (!name || !email || !emergencyContact) {
        return { error: "Missing required fields" };
    }

    try {
        let bookingIdToLink = null;

        // Check if booking exists if ID provided
        if (bookingId) {
            const bookingRes = await fetch(`${API_URL}/bookings/bookings/${bookingId}/`, { next: { revalidate: 60 } });

            if (bookingRes.ok) {
                const booking = await bookingRes.json();
                bookingIdToLink = booking.id;

                // Update booking waiver status
                await fetch(`${API_URL}/bookings/bookings/${booking.id}/`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ waiver_status: "SIGNED" })
                });
            }
        }

        // Create Waiver
        const waiverPayload = {
            name,
            email,
            phone: phone || null,
            emergency_contact: emergencyContact,
            version: "1.0",
            booking: bookingIdToLink
        };

        const waiverRes = await fetch(`${API_URL}/bookings/waivers/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(waiverPayload)
        });

        if (!waiverRes.ok) {
            const error = await waiverRes.json();
            return { error: error.detail || "Failed to submit waiver" };
        }

        revalidatePath("/admin/waivers");
        revalidatePath("/admin/bookings");

        return { success: true };
    } catch (error) {
        console.error("Failed to submit waiver:", error);
        return { error: "Failed to submit waiver" };
    }
}
