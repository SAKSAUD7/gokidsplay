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

// Every page of the site is listed here (the navbar shows only the main ones)
export const footerLinks: { title: string; items: { title: string; href: string; nofollow?: boolean }[] }[] = [
    {
        title: "Explore",
        items: [
            { title: "Home", href: "/" },
            { title: "Attractions", href: "/attractions" },
            { title: "Soft Play", href: "/attractions/soft-play" },
            { title: "Laser Arena", href: "/attractions/laser-arena" },
            { title: "Go Karts", href: "/attractions/go-karts" },
            { title: "Inflatable Park", href: "/attractions/inflatable-park" },
            { title: "Gallery", href: "/gallery" },
            { title: "Events", href: "/events" },
            { title: "Testimonies", href: "/testimonies" },
        ],
    },
    {
        title: "Visit & Book",
        items: [
            { title: "Book Tickets", href: "/book" },
            { title: "Birthday Parties", href: "/parties" },
            { title: "Pricing", href: "/pricing" },
            { title: "Information", href: "/information" },
            { title: "Facilities", href: "/facilities" },
            { title: "Guidelines", href: "/guidelines" },
            { title: "FAQ's", href: "/faq" },
        ],
    },
    {
        title: "About",
        items: [
            { title: "About Us", href: "/about" },
            { title: "Contact Us", href: "/contact" },
            { title: "My Account", href: "/account/login" },
            { title: "Get the App", href: "/app" },
            { title: "Admin Portal", href: "/admin/login", nofollow: true },
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
    },
];
