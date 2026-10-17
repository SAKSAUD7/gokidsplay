"use server";

import { revalidatePath } from "next/cache";
import { bookingSchema, formatPhoneNumber } from "@repo/types";

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
        // Allow letters/digits in any alphabet (Zoë, José…), spaces, dots, @, hyphens, apostrophes
        .replace(/[^\p{L}\p{M}\p{N}\s.@'’-]/gu, '')
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
        // Admin manual bookings are identified by the signed-in admin session (never by a
        // client-supplied flag, since server actions can be called by anyone). They use a
        // simpler schema, skip the online booking fee, and are sent to the API as staff.
        const { getAdminSession } = await import("@/app/lib/admin-auth");
        const adminSession = await getAdminSession().catch(() => null);
        const isAdminBooking = !!adminSession;
        const adminToken = isAdminBooking ? (await import("next/headers")).cookies().get("admin_token")?.value : undefined;
        const apiHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        };

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

        // All-access admission: ticket types are the Session Pricing Plans (the API re-prices
        // public bookings from the same plans). Admin manual bookings still use headcounts.
        const ticketQty: Record<string, number> = (formData.tickets && typeof formData.tickets === "object") ? formData.tickets : {};
        const hasTickets = Object.values(ticketQty).some((q) => Number(q) > 0);
        if (!isAdminBooking && !hasTickets) {
            return { success: false, error: "Please choose at least one ticket." };
        }
        let subtotal = 0;
        if (hasTickets) {
            const plansRes = await fetch(`${API_URL}/cms/pricing-plans/`, { cache: "no-store" });
            const plans: any[] = plansRes.ok ? await plansRes.json() : [];
            for (const plan of plans) {
                const qty = Number(ticketQty[plan.id] || 0);
                if (qty > 0 && plan.type === "SESSION" && plan.active !== false) subtotal += qty * parseFloat(plan.price);
            }
        } else {
            subtotal =
                (data.adults * ADULT_PRICE) +
                (data.kids * KID_PRICE) +
                (data.spectators * SPEC_PRICE);
        }

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
        // Admin bookings skip the online booking fee — it's for the online customer flow only
        const cmsFee = parseFloat(String((cmsConfig as any).online_booking_fee ?? ""));
        const onlineBookingFee = isAdminBooking ? 0 : (Number.isFinite(cmsFee) ? cmsFee : 2.00);
        let totalAmount = parseFloat((subtotal + gst + onlineBookingFee).toFixed(2));
        let discountAmount = 0;
        let voucherId = null;

        // Apply voucher if provided
        if (data.voucherCode) {
            // Re-validate voucher server-side via the dedicated validate endpoint
            // (it checks active/expiry/usage-limit/min-order and computes the discount)
            const voucherRes = await fetch(`${API_URL}/shop/vouchers/validate/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: data.voucherCode,
                    order_amount: subtotal,
                    booking_datetime: data.date && data.time ? `${data.date}T${data.time}` : undefined,
                }),
                cache: "no-store",
            });
            const validation = await voucherRes.json().catch(() => null);

            if (!voucherRes.ok || !validation?.valid) {
                return { success: false, error: validation?.error || "Invalid voucher code" };
            }

            discountAmount = Math.min(Number(validation.discount_amount) || 0, totalAmount);
            // Ensure 2 decimal places
            discountAmount = Number(discountAmount.toFixed(2));

            totalAmount -= discountAmount;
            voucherId = validation.voucher.id;
        }

        // Generate unique booking number
        const bookingNumber = generateBookingNumber();

        // Check for duplicate bookings using the dedicated public endpoint
        const checkDuplicateRes = await fetch(
            `${API_URL}/bookings/bookings/check_duplicate/?email=${encodeURIComponent(sanitizedEmail)}&date=${data.date}&time=${data.time}`,
            { cache: "no-store" }
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
            tickets: hasTickets ? ticketQty : undefined,
            parking_plates: (formData.parkingPlates as string[] || []).filter(Boolean),
            customer_id: formData.customerId || null,
        };

        // The API recalculates the price for public bookings, so the amount below is
        // informational for staff bookings only
        const bookingRes = await fetch(`${API_URL}/bookings/bookings/`, {
            method: "POST",
            headers: apiHeaders,
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
            // Charge exactly what the API stored (it prices public bookings server-side)
            amount: Number(booking.amount ?? totalAmount),
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
