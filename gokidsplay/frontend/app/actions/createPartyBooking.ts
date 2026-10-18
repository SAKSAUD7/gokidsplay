"use server";

import { revalidatePath } from "next/cache";
import { clientIpHeaders } from "@/app/lib/client-ip";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export async function createPartyBooking(formData: any) {
    try {
        const {
            date,
            time,
            participants,
            spectators,
            name,
            email,
            phone,
            childName,
            childAge,
            specialRequests,
            partyPackage,
            packageName,
            theme,
            decorations,
            catering,
            cake,
            photographer,
            partyFavors,
            dietaryRestrictions,
            paymentOption, // 'deposit' | 'full'
        } = formData;

        // Go Kids Play UK Party Pricing: £250 base package for up to 10 kids and 10 spectators
        const basePackagePrice = 250.00;
        const extraParticipantPrice = 20.00;
        const extraSpectatorPrice = 4.95;
        const includedParticipants = 10;
        const includedSpectators = 10;
        const depositPercentage = 0.50; // 50% deposit

        const chargeableParticipants = Math.max(0, (participants || 0) - includedParticipants);
        const chargeableSpectators = Math.max(0, (spectators || 0) - includedSpectators);

        const participantCost = chargeableParticipants * extraParticipantPrice;
        const spectatorCost = chargeableSpectators * extraSpectatorPrice;
        const subtotal = basePackagePrice + participantCost + spectatorCost;
        // No GST for UK — price is VAT-inclusive
        const gstRate = 0;
        const gst = subtotal * (gstRate / 100);
        const totalAmount = subtotal + gst;
        const discountAmount = 0;
        // The API checks the voucher and applies the discount when it prices the
        // booking; an invalid code comes back as an error the customer sees.
        const voucherCode = String(formData.voucherCode || "").trim().toUpperCase() || null;

        // Convert time to 24-hour HH:MM:SS format for backend
        const convertTo24Hour = (timeStr: string) => {
            if (!timeStr) return "12:00:00";

            // Already HH:MM or HH:MM:SS (24-hour)
            if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
                const parts = timeStr.split(':');
                if (parts.length === 2) return `${timeStr}:00`;
                if (parts.length === 3) return timeStr;
                return `${timeStr}:00`;
            }

            const [timePart, modifier] = timeStr.split(' ');
            let [hours, minutes] = timePart.split(':');
            if (hours === '12') {
                hours = modifier === 'PM' ? '12' : '00';
            } else if (modifier === 'PM') {
                hours = (parseInt(hours, 10) + 12).toString().padStart(2, '0');
            }
            return `${hours}:${minutes}:00`;
        };

        const formattedTime = convertTo24Hour(time);

        const partyBookingPayload = {
            name,
            package_name: packageName || 'Go Kids Play £250 Party Package',
            email,
            phone,
            date,
            time: formattedTime,
            duration: 120, // 2-hour party
            adults: spectators || 0,
            kids: participants || 0,
            spectators: spectators || 0,
            birthday_child_name: childName || null,
            birthday_child_age: childAge || null,
            party_package: partyPackage || "STANDARD",
            theme: theme || null,
            decorations: decorations || false,
            catering: catering || false,
            cake: cake || false,
            photographer: photographer || false,
            party_favors: partyFavors || false,
            special_requests: specialRequests || null,
            dietary_restrictions: dietaryRestrictions || null,
            subtotal,
            amount: totalAmount,
            package_price: basePackagePrice,
            deposit_amount: totalAmount * depositPercentage,
            payment_type: paymentOption === 'full' ? 'FULL' : 'DEPOSIT',
            discount_amount: discountAmount,
            voucher_code: voucherCode,
            booking_status: "PENDING",
            payment_status: "PENDING",
            waiver_status: "PENDING",
            customer_id: formData.customerId || null,
        };

        // Staff bookings carry the admin token; public bookings are priced server-side by the API
        const { cookies } = await import("next/headers");
        const adminToken = cookies().get("admin_token")?.value;
        const bookingRes = await fetch(`${API_URL}/bookings/party-bookings/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...clientIpHeaders(),
                ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
            },
            body: JSON.stringify(partyBookingPayload)
        });

        if (!bookingRes.ok) {
            const error = await bookingRes.json().catch(() => ({}));
            return { success: false, error: error.detail || "Failed to create party booking" };
        }

        const booking = await bookingRes.json();

        revalidatePath("/admin");
        revalidatePath("/admin/bookings");
        revalidatePath("/admin/party-bookings");

        return {
            success: true,
            bookingId: booking.uuid || String(booking.id),
            bookingIntId: booking.id,
            booking,
            // Charge exactly what the API stored
            amount: Number(booking.amount ?? totalAmount),
            depositAmount: Number(booking.deposit_amount ?? totalAmount * depositPercentage),

        };
    } catch (error) {
        console.error("Failed to create party booking:", error);
        return { success: false, error: "Failed to create party booking. Please try again." };
    }
}
