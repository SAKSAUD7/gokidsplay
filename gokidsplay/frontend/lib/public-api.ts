// Public API functions - fetch from Django backend
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
    const sections = await fetchFromAPI(`/cms/page-sections/?page=${page}`);
    return sections.filter((s: any) => s.active);
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

export async function getPublicPricingPlans() {
    const plans = await fetchFromAPI('/cms/pricing-plans/');
    return plans.filter((p: any) => p.active);
}

export async function getPublicMenuSections() {
    const menus = await fetchFromAPI('/cms/menu-sections/');
    return menus.filter((m: any) => m.active);
}

export async function getPublicGroupPackages() {
    const packages = await fetchFromAPI('/cms/group-packages/');
    return packages.filter((g: any) => g.active);
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
    const cards = await fetchFromAPI('/cms/timing-cards/');
    return cards.filter((c: any) => c.active);
}

/**
 * Resolved editable content for one page (see lib/cms/page-registry.ts).
 * Includes hidden sections (as null) so pages can respect the admin's
 * "Show this section" switch. Tagged so admin saves refresh it instantly.
 */
export async function getPublicPageContent(page: string) {
    const { resolveSections } = await import('./cms/page-registry');
    let rows: any[] = [];
    try {
        const response = await fetch(`${API_URL}/cms/page-sections/?page=${encodeURIComponent(page)}`, {
            next: { revalidate: 60, tags: ['page-sections'] },
        } as any);
        if (response.ok) rows = await response.json();
    } catch (error) {
        console.error(`Failed to fetch page content for ${page}:`, error);
    }
    return resolveSections(page, Array.isArray(rows) ? rows : []);
}

export async function getPublicTestimonials() {
    const reviews = await fetchFromAPI('/cms/testimonials/');
    return Array.isArray(reviews) ? reviews.filter((r: any) => r.active) : [];
}
