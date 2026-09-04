"use server";

import { revalidatePath } from "next/cache";
import { bookingSchema, formatPhoneNumber } from "@repo/types";
import QRCode from "qrcode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

// Generate unique booking number: SP-YYYYMMDD-XXXX
function generateBookingNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `SP-${year}${month}${day}-${random}`;
}

// Sanitize string input to prevent XSS
function sanitizeString(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
        .replace(/[^\w\s.@'-]/g, '') // Allow only alphanumeric, spaces, dots, @, hyphens, apostrophes
        .trim();
}

// Validate email format server-side
function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Validate phone format server-side (UK & international friendly)
function isValidPhone(phone: string): boolean {
    // Accept UK mobile/landline (07xxx, +447xxx) and general international numbers
    // Strips spaces, dashes, parentheses before checking length
    const cleaned = phone.replace(/[\s\-().+]/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15 && /^\d+$/.test(cleaned);
}

export async function createBooking(formData: any) {
    try {
        // Admin manual bookings don't have waiver/DOB fields — use a simpler schema
        const isAdminBooking = formData.waiverAccepted === undefined;

        let data: any;

        if (isAdminBooking) {
            // Simple validation for admin-created bookings (no waiver required)
            const { z } = await import("zod");
            const adminSchema = z.object({
                date: z.string().min(1, "Please select a date"),
                time: z.string().min(1, "Please select a time slot"),
                duration: z.enum(["60", "90", "120"]),
                adults: z.number().min(0),
                kids: z.number().min(0),
                spectators: z.number().min(0),
                name: z.string().min(1, "Name is required"),
                email: z.string().email("Please enter a valid email address"),
                phone: z.string().min(1, "Phone number is required"),
            });
            const result = adminSchema.safeParse(formData);
            if (!result.success) {
                const firstError = result.error.issues[0];
                return { success: false, error: firstError.message || "Invalid form data." };
            }
            // Inject defaults for fields the full schema expects
            data = {
                ...result.data,
                waiverAccepted: false,
                dateOfBirth: "",
                dateOfArrival: "",
                minors: [],
                adultGuests: [],
            };
        } else {
            // Full customer booking validation
            const validationResult = bookingSchema.safeParse(formData);
            if (!validationResult.success) {
                console.error("Validation failed:", validationResult.error.issues);
                const firstError = validationResult.error.issues[0];
                return {
                    success: false,
                    error: firstError.message || "Invalid form data. Please check your inputs."
                };
            }
            data = validationResult.data;
        }

        // Additional server-side checks
        if (!isValidEmail(data.email)) {
            return { success: false, error: "Invalid email format" };
        }

        // Sanitize inputs
        const sanitizedName = sanitizeString(data.name);
        const sanitizedEmail = data.email.toLowerCase().trim();
        const sanitizedPhone = data.phone.trim();

        // Validate date is not in the past — compare against UK date (Europe/London)
        // The server runs on UTC (Azure), so we must explicitly compute the UK date
        function getUKDateString(): string {
            return new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' })
                .split('/').reverse().join('-'); // dd/mm/yyyy → yyyy-mm-dd
        }
        const ukTodayStr = getUKDateString();
        if (data.date < ukTodayStr) {
            return { success: false, error: "Cannot book for past dates" };
        }

        // Validate time is not in the past for today's bookings (UK time)
        if (data.date === ukTodayStr) {
            const ukNowStr = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false });
            if (data.time <= ukNowStr) {
                return { success: false, error: "Selected time has passed. Please choose a future time slot." };
            }
        }

        // ── Fetch pricing from CMS config (dynamic, admin-controlled) ─────────
        let cmsConfig: Record<string, string> = {};
        try {
            const cfgRes = await fetch(`${API_URL}/cms/session-booking-config/1/`, {
                cache: "no-store",
                signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined,
            });
            if (cfgRes.ok) cmsConfig = await cfgRes.json();
        } catch { /* fall through to defaults */ }

        const ADULT_PRICE = cmsConfig.adult_price ? parseFloat(cmsConfig.adult_price) : 9.95;
        const KID_PRICE = cmsConfig.kid_price ? parseFloat(cmsConfig.kid_price) : 9.95;
        const SPEC_PRICE = cmsConfig.spectator_price ? parseFloat(cmsConfig.spectator_price) : 2.95;
        const GST_RATE = cmsConfig.gst_rate ? parseFloat(cmsConfig.gst_rate) : 0;

        let subtotal =
            (data.adults * ADULT_PRICE) +
            (data.kids * KID_PRICE) +
            (data.spectators * SPEC_PRICE);

        // ── Add-ons — prices also driven by CMS config ─────────────────────
        const ADD_ON_PRICES: Record<string, number> = {
            "parking": cmsConfig.parking_price ? parseFloat(cmsConfig.parking_price) : 3.00,
        };
        const ADD_ON_META: Record<string, { label: string; emoji: string }> = {
            "parking": { label: "Parking", emoji: "\uD83D\uDE97" },
        };

        const formAddOns: Record<string, number> = (formData.addOns as Record<string, number>) || {};
        const formGlobalAddOns: Record<string, number> = (formData.globalAddOns as Record<string, number>) || {};
        const allAddOns = { ...formAddOns, ...formGlobalAddOns };

        const addOnsList: object[] = [];
        let addOnsTotal = 0;
        for (const [id, qty] of Object.entries(allAddOns)) {
            if (qty > 0 && ADD_ON_PRICES[id] !== undefined) {
                const priceEach = ADD_ON_PRICES[id];
                const lineTotal = parseFloat((priceEach * qty).toFixed(2));
                addOnsTotal += lineTotal;
                addOnsList.push({
                    id,
                    label: ADD_ON_META[id]?.label || id,
                    emoji: ADD_ON_META[id]?.emoji || "+",
                    qty,
                    price_each: priceEach,
                    subtotal: lineTotal,
                });
            }
        }

        subtotal = parseFloat((subtotal + addOnsTotal).toFixed(2));
        const gst = parseFloat((subtotal * (GST_RATE / 100)).toFixed(2));
        // Admin bookings skip the online booking fee (£2) — it's for online customer flow only
        const onlineBookingFee = isAdminBooking ? 0 : 2.00;
        let totalAmount = parseFloat((subtotal + gst + onlineBookingFee).toFixed(2));
        let discountAmount = 0;
        let voucherId = null;

        // Apply voucher if provided
        if (data.voucherCode) {
            // Re-validate voucher server-side
            const voucherRes = await fetch(`${API_URL}/shop/vouchers/?code=${data.voucherCode}`, { next: { revalidate: 60 } });

            if (!voucherRes.ok) {
                return { success: false, error: "Invalid voucher code" };
            }

            const vouchers = await voucherRes.json();
            const voucher = vouchers[0];

            if (!voucher) {
                return { success: false, error: "Invalid voucher code" };
            }

            if (!voucher.is_active) {
                return { success: false, error: "This voucher is inactive" };
            }

            // Check expiry
            if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
                return { success: false, error: "This voucher has expired" };
            }

            // Check usage limit
            if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
                return { success: false, error: "This voucher has reached its usage limit" };
            }

            // Check min order amount
            if (voucher.min_order_amount && subtotal < parseFloat(voucher.min_order_amount)) {
                return { success: false, error: `Minimum order of £${parseFloat(voucher.min_order_amount).toLocaleString()} required to use this voucher` };
            }

            // Calculate discount
            if (voucher.discount_type === "PERCENTAGE") {
                discountAmount = (subtotal * parseFloat(voucher.discount_value)) / 100;
            } else {
                discountAmount = parseFloat(voucher.discount_value);
            }

            discountAmount = Math.min(discountAmount, totalAmount);
            // Ensure 2 decimal places
            discountAmount = Number(discountAmount.toFixed(2));

            totalAmount -= discountAmount;
            voucherId = voucher.id;

            // Increment usage count
            await fetch(`${API_URL}/shop/vouchers/${voucher.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ used_count: voucher.used_count + 1 })
            });
        }

        // Generate unique booking number
        const bookingNumber = generateBookingNumber();

        // Check for duplicate bookings using the dedicated public endpoint
        const checkDuplicateRes = await fetch(
            `${API_URL}/bookings/bookings/check_duplicate/?email=${encodeURIComponent(sanitizedEmail)}&date=${data.date}&time=${data.time}`,
            { next: { revalidate: 60 } }
        );

        if (checkDuplicateRes.ok) {
            const result = await checkDuplicateRes.json();
            if (result.exists) {
                return {
                    success: false,
                    error: "A booking with these details was recently created. Please check your email or contact support."
                };
            }
        }

        // Create booking
        const bookingPayload = {
            name: sanitizedName,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            date: data.date,
            time: data.time,
            duration: parseInt(data.duration),
            adults: data.adults,
            kids: data.kids,
            spectators: data.spectators,
            subtotal: Number(subtotal.toFixed(2)),
            amount: Number(totalAmount.toFixed(2)),
            discount_amount: Number(discountAmount.toFixed(2)),
            voucher_code: data.voucherCode || null,
            voucher: voucherId,
            status: "CONFIRMED",
            booking_status: "CONFIRMED",
            payment_status: "PENDING",
            waiver_status: "PENDING",
            type: "SESSION",
            activity: formData.activity || null,
            add_ons: addOnsList.length > 0 ? addOnsList : null,
            parking_plates: (formData.parkingPlates as string[] || []).filter(Boolean),
            customer_id: formData.customerId || null,
        };

        const bookingRes = await fetch(`${API_URL}/bookings/bookings/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingPayload)
        });

        if (!bookingRes.ok) {
            let errorMessage = "Failed to create booking";
            try {
                const errorText = await bookingRes.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    if (bookingRes.status === 409 && errorJson.code === 'CAPACITY_EXCEEDED') {
                        // Friendly capacity message for the user
                        errorMessage = errorJson.detail ||
                            'This time slot is now fully booked. Please choose a different time.';
                    } else {
                        errorMessage = errorJson.detail || errorJson.error || "Failed to create booking";
                    }
                } catch {
                    console.error("Non-JSON error response from booking API:", errorText.substring(0, 500));
                    errorMessage = `Server Error (${bookingRes.status}). Please try again later.`;
                }
            } catch (e) {
                console.error("Failed to read error response:", e);
            }
            return { success: false, error: errorMessage };
        }

        const booking = await bookingRes.json();

        // Create waiver ONLY if customer accepted it
        if (data.waiverAccepted) {
            const waiverPayload = {
                name: sanitizedName,
                email: sanitizedEmail,
                phone: sanitizedPhone,
                dob: data.dateOfBirth || null,
                participant_type: 'ADULT',
                is_primary_signer: true,
                version: "1.0",
                minors: data.minors || [],
                adults: data.adultGuests || [],
                booking: booking.id
            };

            await fetch(`${API_URL}/bookings/waivers/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(waiverPayload)
            });

            // Update booking waiver status to SIGNED (since waiver was just created)
            await fetch(`${API_URL}/bookings/bookings/${booking.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ waiver_status: "SIGNED" })
            });
        }
        // If waiver not accepted, status stays PENDING (default)

        // Generate QR Code for the booking
        const qrData = JSON.stringify({
            id: booking.uuid || booking.id,
            name: booking.name,
            date: booking.date,
            time: booking.time,
            guests: booking.adults + booking.kids + booking.spectators
        });

        const qrCode = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 2,
        });

        // Update booking with QR code
        await fetch(`${API_URL}/bookings/bookings/${booking.id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qr_code: qrCode })
        });

        console.log("Booking created successfully:", {
            id: booking.id,
            uuid: booking.uuid,
            bookingNumber,
            email: sanitizedEmail,
            date: data.date,
            time: data.time
        });

        revalidatePath("/admin");
        revalidatePath("/admin/bookings");

        return {
            success: true,
            bookingId: booking.uuid || booking.id, // UUID for display/tracking
            bookingIntId: booking.id, // Integer ID for backend operations (payments)
            bookingNumber: bookingNumber,
            amount: Number(totalAmount.toFixed(2)), // Total amount for SumUp payment
        };
    } catch (error) {
        console.error("Failed to create booking:", error);

        // Don't expose internal errors to client
        return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        };
    }
}
