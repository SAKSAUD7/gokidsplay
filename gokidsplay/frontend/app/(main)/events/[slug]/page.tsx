import { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetailContent from "./components/EventDetailContent";
import { getMediaUrl } from "@/lib/media-utils";

export const dynamic = "force-dynamic";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace("localhost", "127.0.0.1");

async function fetchEvent(slug: string) {
    try {
        const res = await fetch(`${API_URL}/bookings/public/events/${slug}/`, { cache: "no-store" });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const event = await fetchEvent(params.slug);
    if (!event) return { title: "Event Not Found | Go Kids Play" };
    return {
        title: `${event.title} | Go Kids Play Events`,
        description: event.short_description || `Book your place at ${event.title} — a special event at Go Kids Play Coventry.`,
        openGraph: {
            title: `${event.emoji} ${event.title} | Go Kids Play`,
            description: event.short_description || "",
            images: event.cover_image ? [{ url: getMediaUrl(event.cover_image) }] : [],
        },
    };
}

// schema.org Event data so search engines can show the event in results
function eventJsonLd(event: any, slug: string) {
    const time = (t?: string) => (t ? String(t).slice(0, 5) : "00:00");
    const price = parseFloat(event.price_per_child ?? "0") || 0;
    return {
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        description: event.short_description || event.description || undefined,
        startDate: `${event.date}T${time(event.start_time)}`,
        endDate: `${event.date}T${time(event.end_time)}`,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        image: event.cover_image ? [getMediaUrl(event.cover_image)] : undefined,
        location: {
            "@type": "Place",
            name: "Go Kids Play",
            address: {
                "@type": "PostalAddress",
                streetAddress: "310 Kingfield Road",
                addressLocality: "Coventry",
                postalCode: "CV1 4LD",
                addressCountry: "GB",
            },
        },
        organizer: { "@type": "Organization", name: "Go Kids Play", url: "https://gokidsplay.co.uk" },
        offers: {
            "@type": "Offer",
            url: `https://gokidsplay.co.uk/events/${slug}`,
            price: price.toFixed(2),
            priceCurrency: "GBP",
            availability: event.is_sold_out ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        },
    };
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
    const event = await fetchEvent(params.slug);
    if (!event) notFound();
    // "<" is escaped so admin-entered text can never close the script tag
    const jsonLd = JSON.stringify(eventJsonLd(event, params.slug)).replace(/</g, "\\u003c");
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
            <EventDetailContent event={event} />
        </>
    );
}
