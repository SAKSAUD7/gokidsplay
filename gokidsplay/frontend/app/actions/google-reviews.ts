"use server";

import { revalidatePath } from "next/cache";
import { fetchAPI } from "../lib/server-api";

export interface GoogleReviewsStatus {
    rating: number | null;
    review_count: number | null;
    reviews_url: string;
    write_review_url: string;
    last_synced: string | null;
    connected?: boolean;
    place_id?: string;
    search_query?: string;
    maps_url?: string;
    min_rating_to_show?: number;
    auto_sync?: boolean;
    show_photos?: boolean;
    photo_count?: number;
    last_error?: string;
}

/** Google reviews connection status for Admin → Customer Reviews. */
export async function getGoogleReviewsStatus(): Promise<GoogleReviewsStatus | null> {
    const res = await fetchAPI("/cms/google-reviews/");
    return res.ok ? res.json() : null;
}

export async function saveGoogleReviewsSettings(data: Partial<GoogleReviewsStatus>) {
    const res = await fetchAPI("/cms/google-reviews/", { method: "PATCH", body: JSON.stringify(data) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false as const, error: body.error || "Could not save" };
    revalidatePath("/testimonies");
    return { success: true as const, status: body as GoogleReviewsStatus };
}

/** Fetch the latest rating and reviews from Google now. */
export async function syncGoogleReviews() {
    const res = await fetchAPI("/cms/google-reviews/sync/", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    revalidatePath("/testimonies");
    revalidatePath("/admin/cms/collections/testimonials");
    if (!res.ok) return { success: false as const, error: body.error || "Sync failed", status: body as GoogleReviewsStatus };
    return { success: true as const, created: body.created as number, updated: body.updated as number, status: body as GoogleReviewsStatus };
}
