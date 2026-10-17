import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { UIProvider } from "../state/ui/uiContext";
import { GlobalAlert } from "../components/GlobalAlert";
import Script from "next/script";

import { getMetadata } from "@/seo/seo.config";
import { getPublicSessionSettings } from "@/lib/public-api";
import { openingHoursSpecification } from "@/lib/hours-text";
import { readSessionRules } from "@/lib/api/types";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = getMetadata();

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: "#0a0118",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}): Promise<JSX.Element> {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    // Opening hours for search engines, from Website Content → Session Booking
    const hoursSpec = openingHoursSpecification(readSessionRules(await getPublicSessionSettings()));
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" href="/favicon.png" type="image/png" />
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/gokidsplay-logo.png" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@graph": [
                                {
                                    "@type": "LocalBusiness",
                                    "@id": "https://gokidsplay.co.uk/#localbusiness",
                                    "name": "Go Kids Play",
                                    "description": "Go Kids Play is Coventry's premier indoor family entertainment centre offering soft play, laser arena, go-karts, an inflatable park and party bookings.",
                                    "url": "https://gokidsplay.co.uk",
                                    "logo": "https://gokidsplay.co.uk/gokidsplay-logo.png",
                                    "image": "https://gokidsplay.co.uk/gokidsplay-logo.png",
                                    "telephone": "+44-7349110865",
                                    "email": "info@gokidsplay.co.uk",
                                    "address": {
                                        "@type": "PostalAddress",
                                        "streetAddress": "310 Kingfield Road",
                                        "addressLocality": "Coventry",
                                        "addressRegion": "West Midlands",
                                        "postalCode": "CV1 4LD",
                                        "addressCountry": "GB"
                                    },

                                    "geo": {
                                        "@type": "GeoCoordinates",
                                        "latitude": 52.4081,
                                        "longitude": -1.5106
                                    },
                                    "priceRange": "££",
                                    "currenciesAccepted": "GBP",
                                    "paymentAccepted": "Cash, Credit Card",
                                    "openingHoursSpecification": hoursSpec,
                                    "hasMap": "https://maps.google.com/?q=Go+Kids+Play+Coventry",
                                    "sameAs": [
                                        "https://www.facebook.com/GoKidsPlayCoventry",
                                        "https://www.instagram.com/gokidsplay"
                                    ]
                                },
                                {
                                    "@type": "Organization",
                                    "@id": "https://gokidsplay.co.uk/#organization",
                                    "name": "Go Kids Play",
                                    "url": "https://gokidsplay.co.uk",
                                    "logo": {
                                        "@type": "ImageObject",
                                        "url": "https://gokidsplay.co.uk/gokidsplay-logo.png",
                                        "width": 512,
                                        "height": 512
                                    }
                                }
                            ]
                        })
                    }}
                />
            </head>
            <body className={`${inter.variable} ${outfit.variable} font-sans bg-background text-white`}>
                {gaId && (
                    <>
                        <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
                        <Script id="ga4-init" strategy="afterInteractive">{`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            window.gtag = gtag;
                            // Consent mode: no analytics cookies until the visitor accepts (CookieConsent banner)
                            var consent = null;
                            try { consent = localStorage.getItem('gkp-cookie-consent'); } catch (e) {}
                            gtag('consent', 'default', {
                                analytics_storage: consent === 'accepted' ? 'granted' : 'denied',
                                ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
                            });
                            gtag('js', new Date());
                            gtag('config', '${gaId}', { page_path: window.location.pathname });
                        `}</Script>
                    </>
                )}
                <UIProvider>
                    <Script id="register-sw" strategy="afterInteractive">{`
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', function() {
                                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                                    console.log('ServiceWorker registration successful');
                                }, function(err) {
                                    console.log('ServiceWorker registration failed: ', err);
                                });
                            });
                        }
                    `}</Script>
                    <GlobalAlert />
                    {children}
                </UIProvider>
            </body>
        </html>
    );
}
