
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

export const API_ENDPOINTS = {
    // CMS Endpoints
    cms: {
        banners: `${API_BASE_URL}/cms/banners/`,
        activities: `${API_BASE_URL}/cms/activities/`,
        faqs: `${API_BASE_URL}/cms/faqs/`,
        testimonials: `${API_BASE_URL}/cms/testimonials/`,
        pages: `${API_BASE_URL}/cms/pages/`,
        socialLinks: `${API_BASE_URL}/cms/social-links/`,
        gallery: `${API_BASE_URL}/cms/gallery/`,
        freeEntries: `${API_BASE_URL}/cms/free-entries/`,
        page_sections: `${API_BASE_URL}/cms/page-sections/`,
        stat_cards: `${API_BASE_URL}/cms/stat-cards/`,
        timeline_items: `${API_BASE_URL}/cms/timeline-items/`,
        value_items: `${API_BASE_URL}/cms/value-items/`,
        contact_info: `${API_BASE_URL}/cms/contact-info/`,
        party_packages: `${API_BASE_URL}/cms/party-packages/`,
        pricing_plans: `${API_BASE_URL}/cms/pricing-plans/`,
        facility_items: `${API_BASE_URL}/cms/facility-items/`,
        guideline_categories: `${API_BASE_URL}/cms/guideline-categories/`,
        legal_documents: `${API_BASE_URL}/cms/legal-documents/`,
        menu_sections: `${API_BASE_URL}/cms/menu-sections/`,
        contact_messages: `${API_BASE_URL}/cms/contact-messages/`,
        pricing_carousel_images: `${API_BASE_URL}/cms/pricing-carousel-images/`,
        timing_cards: `${API_BASE_URL}/cms/timing-cards/`,
        upload: `${API_BASE_URL}/cms/upload/`,
    },

    // Core Endpoints
    core: {
        users: `${API_BASE_URL}/core/users/`,
        settings: `${API_BASE_URL}/core/settings/`,
        dashboard: `${API_BASE_URL}/core/dashboard/`,
    },

    // Bookings Endpoints
    bookings: {
        customers: `${API_BASE_URL}/bookings/customers/`,
        bookings: `${API_BASE_URL}/bookings/bookings/`,
        waivers: `${API_BASE_URL}/bookings/waivers/`,
        transactions: `${API_BASE_URL}/bookings/transactions/`,
        bookingBlocks: `${API_BASE_URL}/bookings/booking-blocks/`,
    },

    // Marketing Endpoints
    marketing: {
        campaigns: `${API_BASE_URL}/marketing/marketing-campaigns/`,
        templates: `${API_BASE_URL}/marketing/email-templates/`,
    },

    // Auth Endpoints
    auth: {
        token: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:9000'}/api/token/`,
        refresh: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:9000'}/api/token/refresh/`,
    },
};

export default API_ENDPOINTS;
