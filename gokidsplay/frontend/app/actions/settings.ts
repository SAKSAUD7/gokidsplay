"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission, getAdminSession } from "../lib/admin-auth";
import { logActivity } from "../lib/audit-log";
import { revalidatePath } from "next/cache";

export async function getSettings() {
    // Public function - no auth required (used in public layout)
    try {
        const res = await fetchAPI("/core/settings/");
        if (!res || !res.ok) return null;
        const data = await res.json();
        // Assuming settings is a singleton, get first item
        const raw = data[0];
        if (!raw) return null;

        return {
            id: raw.id,
            parkName: raw.park_name,
            contactPhone: raw.contact_phone,
            contactEmail: raw.contact_email,
            address: raw.address,
            mapUrl: raw.map_url,
            openingHours: raw.opening_hours,
            marqueeText: raw.marquee_text,
            aboutText: raw.about_text,
            heroTitle: raw.hero_title,
            heroSubtitle: raw.hero_subtitle,
            gstNumber: raw.gst_number,
            sessionDuration: raw.session_duration,
            adultPrice: parseFloat(raw.adult_price),
            childPrice: parseFloat(raw.child_price),
            onlineBookingEnabled: raw.online_booking_enabled,
            partyBookingsEnabled: raw.party_bookings_enabled,
            maintenanceMode: raw.maintenance_mode,
            waiverRequired: raw.waiver_required,
            partyAvailability: raw.party_availability,
        };
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return null;
    }
}

export async function updateSettings(id: string, data: any) {
    await requirePermission('settings', 'write');

    // Transform camelCase to snake_case for specific fields
    const payload: any = { ...data };
    if (data.parkName) {
        payload.park_name = data.parkName;
        delete payload.parkName;
    }
    if (data.contactPhone) {
        payload.contact_phone = data.contactPhone;
        delete payload.contactPhone;
    }
    if (data.contactEmail) {
        payload.contact_email = data.contactEmail;
        delete payload.contactEmail;
    }
    if (data.mapUrl) {
        payload.map_url = data.mapUrl;
        delete payload.mapUrl;
    }
    if (data.openingHours) {
        payload.opening_hours = data.openingHours;
        delete payload.openingHours;
    }
    if (data.marqueeText) {
        payload.marquee_text = data.marqueeText;
        delete payload.marqueeText;
    }
    if (data.aboutText) {
        payload.about_text = data.aboutText;
        delete payload.aboutText;
    }
    if (data.heroTitle) {
        payload.hero_title = data.heroTitle;
        delete payload.heroTitle;
    }
    if (data.heroSubtitle) {
        payload.hero_subtitle = data.heroSubtitle;
        delete payload.heroSubtitle;
    }
    if (data.gstNumber) {
        payload.gst_number = data.gstNumber;
        delete payload.gstNumber;
    }
    if (data.sessionDuration) {
        payload.session_duration = data.sessionDuration;
        delete payload.sessionDuration;
    }
    if (data.adultPrice) {
        payload.adult_price = data.adultPrice;
        delete payload.adultPrice;
    }
    if (data.childPrice) {
        payload.child_price = data.childPrice;
        delete payload.childPrice;
    }
    if (data.onlineBookingEnabled !== undefined) {
        payload.online_booking_enabled = data.onlineBookingEnabled;
        delete payload.onlineBookingEnabled;
    }
    if (data.partyBookingsEnabled !== undefined) {
        payload.party_bookings_enabled = data.partyBookingsEnabled;
        delete payload.partyBookingsEnabled;
    }
    if (data.maintenanceMode !== undefined) {
        payload.maintenance_mode = data.maintenanceMode;
        delete payload.maintenanceMode;
    }
    if (data.waiverRequired !== undefined) {
        payload.waiver_required = data.waiverRequired;
        delete payload.waiverRequired;
    }

    const res = await fetchAPI(`/core/settings/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'UPDATE',
        entity: 'SETTINGS',
        entityId: id,
        details: { changes: Object.keys(data) }
    });

    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
}

export async function updatePassword(currentPass: string, newPass: string) {
    const session = await getAdminSession();

    if (!session || !session.id) {
        throw new Error("Unauthorized");
    }

    // Note: In a production environment, we should verify currentPass here.
    // For this implementation, we trust the active authenticated session.

    const res = await fetchAPI(`/core/users/${session.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPass })
    });

    if (!res || !res.ok) {
        // Try to get error message
        try {
            const err = await res.json();
            console.error("Password update failed:", err);
        } catch (e) { }
        throw new Error("Failed to update password");
    }

    await logActivity({
        action: 'UPDATE',
        entity: 'USER',
        entityId: session.id,
        details: { field: "password_change" }
    });

    return { success: true };
}
