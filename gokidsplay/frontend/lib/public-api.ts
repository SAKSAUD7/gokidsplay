// Public API functions - fetch from Django backend
import { fillHours, hoursPlaceholdersFromConfig } from './hours-text';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

// Cache CMS content for 60 seconds (ISR) — dramatically improves page load speed.
// Set to 0 for always-fresh data, increase for production (e.g. 300 = 5 mins).
const FETCH_OPTS: RequestInit = { next: { revalidate: 60 } } as any;

async function fetchFromAPI(endpoint: string) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, FETCH_OPTS);

        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Failed to fetch ${endpoint}:`, error);
        return [];
    }
}

export async function getPublicBanners() {
    const banners = await fetchFromAPI('/cms/banners/');
    return banners.filter((b: any) => b.active);
}



export async function getPublicActivities() {
    const activities = await fetchFromAPI('/cms/activities/');
    return activities.filter((a: any) => a.active);
}

export async function getPublicFaqs() {
    const faqs = await fetchFromAPI('/cms/faqs/');
    return faqs.filter((f: any) => f.active);
}

export async function getGlobalSettings() {
    const settings = await fetchFromAPI('/core/settings/');

    // Return the first settings object or default
    if (settings && settings.length > 0) {
        const s = settings[0];
        // Transform Django snake_case to camelCase for frontend compatibility
        return {
            parkName: s.park_name || "Go Kids Play",
            contactPhone: s.contact_phone || "07349110865",
            contactEmail: s.contact_email || "info@gokidsplay.co.uk",
            address: s.address || "",
            mapUrl: s.map_url || "",
            openingHours: s.opening_hours || {},
            marqueeText: s.marquee_text || [],
            aboutText: s.about_text || "",
            heroTitle: s.hero_title || "",
            heroSubtitle: s.hero_subtitle || "",
            gstNumber: s.gst_number || "",
            sessionDuration: s.session_duration || 60,
            adultPrice: s.adult_price || 995,
            childPrice: s.child_price || 995,
            onlineBookingEnabled: s.online_booking_enabled !== false,
            partyBookingsEnabled: s.party_bookings_enabled !== false,
            maintenanceMode: s.maintenance_mode || false,
            waiverRequired: s.waiver_required !== false,
        };
    }

    // Return default settings if none exist
    return {
        parkName: "Go Kids Play",
        contactPhone: "07349110865",
        contactEmail: "info@gokidsplay.co.uk",
        address: "Ramdoot House, First Floor - 2/3 Navigation Street, Leicester, LE13UR",
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2425.123!2d-1.1234!3d52.6369!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTLCsDM4JzEyLjgiTiAxwrAwNycyNC40Ilc!5e0!3m2!1sen!2suk!4v1234567890",
        openingHours: {
            weekdays: "Check website for hours",
            weekends: "Check website for hours"
        },
        aboutText: "Go Kids Play is Leicester's ultimate destination for bowling, roller skating, and arcade fun. Experience Leicester's first roller skating rink!",
        sessionDuration: 60,
        adultPrice: 995,
        childPrice: 995,
        onlineBookingEnabled: true,
        partyBookingsEnabled: true,
        maintenanceMode: false,
        waiverRequired: true,
    };
}

export async function getPublicSocialLinks() {
    const socialLinks = await fetchFromAPI('/cms/social-links/');
    return socialLinks.filter((s: any) => s.active);
}

export async function getPublicGallery() {
    const gallery = await fetchFromAPI('/cms/gallery/');
    return gallery.filter((g: any) => g.active);
}

export async function getPublicPageSections(page: string) {
    const [sections, hours] = await Promise.all([fetchFromAPI(`/cms/page-sections/?page=${page}`), getPublicHoursText()]);
    return fillHours(sections.filter((s: any) => s.active), hours);
}

export async function getPublicInstagramReels() {
    const reels = await fetchFromAPI('/cms/instagram-reels/');
    return reels.filter((r: any) => r.active);
}

export async function getPublicStatCards(page: string) {
    const cards = await fetchFromAPI(`/cms/stat-cards/?page=${page}`);
    return cards.filter((c: any) => c.active);
}

export async function getPublicPartyPackages() {
    const packages = await fetchFromAPI('/cms/party-packages/');
    return packages.filter((p: any) => p.active);
}

/** Session booking settings (opening hours, session rules, online booking fee). */
export async function getPublicSessionSettings(): Promise<Record<string, any> | null> {
    const data = await fetchFromAPI('/cms/session-booking-config/1/');
    return data && !Array.isArray(data) ? data : null;
}

/**
 * Values for the {open}, {close}, {hours}, {days}… placeholders in website text,
 * from the Session Booking opening hours (see lib/hours-text.ts).
 */
export async function getPublicHoursText(): Promise<Record<string, string>> {
    return hoursPlaceholdersFromConfig(await getPublicSessionSettings());
}

/** Live-site wording for the online booking fee, or null when there is no fee. */
export function onlineFeeNote(settings: Record<string, any> | null): string | null {
    const raw = settings?.online_booking_fee;
    const fee = raw === undefined || raw === null ? 2 : parseFloat(raw);
    if (!Number.isFinite(fee) || fee <= 0) return null;
    return `If you book tickets online, there will be a £${fee.toFixed(2).replace(/\.00$/, "")} booking fee. You can buy tickets directly at the centre by paying cash to avoid this fee.`;
}

export async function getPublicPricingPlans() {
    const plans = await fetchFromAPI('/cms/pricing-plans/');
    return plans.filter((p: any) => p.active);
}

export async function getPublicMenuSections() {
    const menus = await fetchFromAPI('/cms/menu-sections/');
    return menus.filter((m: any) => m.active);
}

export async function getPublicTimelineItems() {
    const items = await fetchFromAPI('/cms/timeline-items/');
    return items.filter((i: any) => i.active);
}

export async function getPublicValueItems() {
    const items = await fetchFromAPI('/cms/value-items/');
    return items.filter((v: any) => v.active);
}

export async function getPublicFacilities() {
    const facilities = await fetchFromAPI('/cms/facility-items/');
    return facilities.filter((f: any) => f.active);
}

export async function getPublicGuidelines() {
    const guidelines = await fetchFromAPI('/cms/guideline-categories/');
    return guidelines.filter((g: any) => g.active);
}

export async function getPublicPricingCarouselImages() {
    const images = await fetchFromAPI('/cms/pricing-carousel-images/');
    return images.filter((i: any) => i.active);
}

export async function getPublicTimingCards() {
    const [cards, hours] = await Promise.all([fetchFromAPI('/cms/timing-cards/'), getPublicHoursText()]);
    return fillHours(cards.filter((c: any) => c.active), hours);
}

/**
 * Resolved editable content for one page (see lib/cms/page-registry.ts).
 * Includes hidden sections (as null) so pages can respect the admin's
 * "Show this section" switch. Tagged so admin saves refresh it instantly.
 */
export async function getPublicPageContent(page: string) {
    const { resolveSections } = await import('./cms/page-registry');
    const hoursText = getPublicHoursText();
    let rows: any[] = [];
    try {
        const response = await fetch(`${API_URL}/cms/page-sections/?page=${encodeURIComponent(page)}`, {
            next: { revalidate: 60, tags: ['page-sections'] },
        } as any);
        if (response.ok) rows = await response.json();
    } catch (error) {
        console.error(`Failed to fetch page content for ${page}:`, error);
    }
    return fillHours(resolveSections(page, Array.isArray(rows) ? rows : []), await hoursText);
}

/** Google rating, number of reviews and the links to read / write reviews on Google. */
export async function getPublicGoogleReviews(): Promise<{
    rating: number | null; review_count: number | null; reviews_url: string; write_review_url: string;
    photos?: { url: string; width?: number; height?: number; author?: string; author_url?: string }[];
} | null> {
    const data = await fetchFromAPI('/cms/google-reviews/');
    return data && !Array.isArray(data) && data.reviews_url ? data : null;
}

export async function getPublicTestimonials() {
    const reviews = await fetchFromAPI('/cms/testimonials/');
    return Array.isArray(reviews) ? reviews.filter((r: any) => r.active) : [];
}
