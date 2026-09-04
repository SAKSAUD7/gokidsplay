export const siteConfig = {
    name: "Go Kids Play",
    description: "Coventry's most exciting indoor play and Party Centre. Laser Arena, Go Karts, Soft Play, Inflatable Park & more!",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.gokidsplay.co.uk",
    ogImage: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.gokidsplay.co.uk"}/og.jpg`,
    links: {
        twitter: "https://twitter.com/gokidsgoleic",
        instagram: "https://www.instagram.com/gokidsgoleic/",
        facebook: "https://www.facebook.com/gokidsgoleic",
    },
    contact: {
        phone: "07349110865",
        email: "info@gokidsplay.co.uk",
        address: "310 Kingfield Road, Coventry, CV14LD",
        mapUrl: "https://maps.google.com/?q=310+Kingfield+Road,+Coventry,+CV1+4LD",
    },
    hours: {
        note: "Open School Holidays & Weekends only",
        monTue: "Closed (except Bank & School Holidays)",
        wedSun: "10:00am – 5:30pm",
    },
};

export const navLinks = [
    { title: "Home", href: "/" },
    { title: "Activities", href: "/attractions" },
    { title: "Events", href: "/events" },
    { title: "Book Party", href: "/parties" },
    { title: "Book Tickets", href: "/book" },
    { title: "Prices", href: "/pricing" },
    { title: "Gallery", href: "/gallery" },
    { title: "FAQ", href: "/faq" },
    { title: "Contact", href: "/contact" },
];

export const footerLinks = [
    {
        title: "Pages",
        items: [
            { title: "Home", href: "/" },
            { title: "Activities", href: "/attractions" },
            { title: "Special Events", href: "/events" },
            { title: "Pricing", href: "/pricing" },
            { title: "Birthday Parties", href: "/parties" },
            { title: "Gallery", href: "/gallery" },
            { title: "About Us", href: "/about" },
            { title: "Contact Us", href: "/contact" },
        ],
    },
    {
        title: "Information",
        items: [
            { title: "FAQ's", href: "/faq" },
            { title: "Guidelines & Safety", href: "/guidelines" },
            { title: "Facilities", href: "/facilities" },
            { title: "Privacy Policy", href: "/privacy" },
            { title: "Terms of Service", href: "/terms" },
        ],
    },
    {
        title: "Bookings",
        items: [
            { title: "Book Tickets", href: "/book" },
            { title: "Birthday Parties", href: "/parties" },
            { title: "Special Events", href: "/events" },
            { title: "Admin Portal", href: "/admin" },
        ],
    },
];
