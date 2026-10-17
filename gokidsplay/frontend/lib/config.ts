export const siteConfig = {
    name: "Go Kids Play",
    description: "Coventry's most exciting indoor play and Party Centre. Laser Arena, Go Karts, Soft Play, Inflatable Park & more!",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.gokidsplay.co.uk",
    ogImage: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.gokidsplay.co.uk"}/og.jpg`,
    links: {
        twitter: "https://twitter.com/gokidsplay",
        instagram: "https://www.instagram.com/gokidsplay/",
        facebook: "https://www.facebook.com/gokidsplay",
    },
    contact: {
        phone: "07349110865",
        email: "info@gokidsplay.co.uk",
        address: "310 Kingfield Road, Coventry, CV14LD",
        mapUrl: "https://maps.google.com/?q=310+Kingfield+Road,+Coventry,+CV1+4LD",
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
        title: "Explore",
        items: [
            { title: "Home", href: "/" },
            { title: "Activities", href: "/attractions" },
            { title: "Gallery", href: "/gallery" },
            { title: "Events", href: "/events" },
            { title: "Testimonies", href: "/testimonies" },
            { title: "About Us", href: "/about" },
        ],
    },
    {
        title: "Book & Info",
        items: [
            { title: "Book Tickets", href: "/book" },
            { title: "Birthday Parties", href: "/parties" },
            { title: "Group Bookings", href: "/groups" },
            { title: "Pricing", href: "/pricing" },
            { title: "Facilities", href: "/facilities" },
            { title: "FAQ's", href: "/faq" },
            { title: "Contact Us", href: "/contact" },
        ],
    },
    {
        title: "Legal",
        items: [
            { title: "Privacy Policy", href: "/privacy" },
            { title: "Cookies", href: "/cookies" },
            { title: "Your Rights", href: "/rights" },
            { title: "Security", href: "/security" },
            { title: "Disclaimer", href: "/disclaimer" },
            { title: "Terms", href: "/terms" },
        ],
    }
];
