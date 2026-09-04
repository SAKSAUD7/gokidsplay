import { PricingTier } from "@repo/types";

// Go Kids Play Coventry — Open Saturday, Sunday, School & Bank Holidays
// Play session is 2 hours only

export const sessionPricing: PricingTier[] = [
    {
        id: "baby",
        title: "Under 12 months",
        price: 195, // £1.95
        duration: 120,
        type: "weekday",
        features: [
            "2 Hour Play Session",
            "Toddler Play Area Access",
            "Parent/Guardian Must Accompany",
        ],
    },
    {
        id: "toddler",
        title: "Under 24 months",
        price: 795, // £7.95
        duration: 120,
        type: "weekday",
        features: [
            "2 Hour Play Session",
            "Toddler Play Area Access",
            "Parent/Guardian Must Accompany",
        ],
    },
    {
        id: "child",
        title: "24 months & above",
        price: 1295, // £12.95
        duration: 120,
        type: "weekday",
        isPopular: true,
        features: [
            "2 Hour Play Session",
            "Mega Soft Play",
            "Laser Arena",
            "Go Karts",
            "Ninja Inflatable",
            "Tangle Tower & Sports Pitch",
        ],
    },
    {
        id: "spectator",
        title: "Non playing adult",
        price: 495, // £4.95
        duration: 120,
        type: "weekday",
        features: [
            "Entry to Viewing Area",
            "Café Access",
            "Comfortable Seating",
        ],
    },
];

// Kept for backward compatibility — same prices apply any day
export const weekdayPricing: PricingTier[] = sessionPricing;
export const weekendPricing: PricingTier[] = sessionPricing;

export const addOns = [
    { id: "extra-hour", title: "Extra Hour", price: 0, note: "Session is fixed at 2 hours" },
];

export const pricingNotes = [
    "Open Saturday, Sunday, School & Bank Holidays only (10am – 5:30pm)",
    "CASH ONLY on the day — free Cash Machine available on site",
    "Book online to pay by card",
    "Session is 2 hours only",
    "Mon/Tue closed (except Bank & School Holidays)",
];
