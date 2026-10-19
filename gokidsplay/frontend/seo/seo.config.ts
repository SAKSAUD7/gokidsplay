import { Metadata } from "next";

// Go Kids Play — Coventry Indoor Play Centre
const PRIMARY_KEYWORDS = [
  "indoor play coventry",
  "soft play coventry",
  "laser arena coventry",
  "go kart coventry",
  "inflatable park coventry",
  "kids activities coventry",
  "family entertainment coventry",
  "indoor activities coventry",
  "fun things to do coventry",
  "children activities coventry",
  "indoor play centre coventry",
  "family fun coventry",
  "weekend activities coventry",
  "coventry indoor play",
  "coventry play centre",
  "coventry kids play",
  "coventry leisure activities",
  "things to do coventry",
  "coventry attractions",
];

const BOOKING_KEYWORDS = [
  "birthday party coventry",
  "kids birthday party coventry",
  "party venue coventry",
  "party packages coventry",
  "coventry party venue",
  "book play sessions coventry",
  "group bookings coventry",
  "school holiday activities coventry",
  "event venue coventry",
  "group activities coventry",
];

const BRAND_KEYWORDS = [
  "go kids play",
  "gokidsplay",
  "go kids play coventry",
  "coventry play centre",
  "kingfield road coventry",
  "amusement centre coventry",
  "indoor entertainment coventry",
];

const COVENTRY_KEYWORDS = [
  "play in coventry",
  "kids play coventry",
  "coventry soft play",
  "coventry laser tag",
  "coventry go karts",
  "coventry bounce park",
  "coventry indoor activities",
  "coventry family fun",
  "coventry entertainment",
  "coventry leisure",
  "cv1 things to do",
  "coventry amusement",
  "indoor play area coventry",
];

export const SEO_KEYWORDS = [
  ...PRIMARY_KEYWORDS,
  ...BOOKING_KEYWORDS,
  ...BRAND_KEYWORDS,
  ...COVENTRY_KEYWORDS,
];

export const SEO_CONFIG = {
  siteName: "Go Kids Play",
  title: "Go Kids Play | Indoor Play Centre Coventry — Soft Play, Laser Arena, Go Karts & More",
  description:
    "Go Kids Play is Coventry's most exciting indoor play and party centre. Enjoy Soft Play, Laser Arena, Go Karts, Inflatable Park & birthday parties. Open school holidays & weekends.",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.gokidsplay.co.uk",
  keywords: SEO_KEYWORDS,
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://www.gokidsplay.co.uk/",
    siteName: "Go Kids Play",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Go Kids Play Coventry — Indoor Play Centre",
      },
    ],
  },
};

export function getMetadata(
  title?: string,
  description?: string,
  exactTitle: boolean = false,
  icons?: Metadata["icons"]
): Metadata {
  const metaTitle = title
    ? exactTitle
      ? title
      : `${title} | ${SEO_CONFIG.siteName}`
    : SEO_CONFIG.title;

  const metaDescription = description || SEO_CONFIG.description;

  return {
    metadataBase: new URL(SEO_CONFIG.baseUrl),
    title: metaTitle,
    description: metaDescription,
    keywords: SEO_CONFIG.keywords,
    openGraph: {
      ...SEO_CONFIG.openGraph,
      title: metaTitle,
      description: metaDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: SEO_CONFIG.openGraph.images,
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: icons || {
      icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon.png", type: "image/png" }],
      apple: "/apple-touch-icon.png",
    },
    applicationName: "Go Kids Play",
    // Installed on an iPhone: opens full screen with the site's own title
    appleWebApp: { capable: true, title: "Go Kids Play", statusBarStyle: "black-translucent" },
    formatDetection: { telephone: false },
  };
}
