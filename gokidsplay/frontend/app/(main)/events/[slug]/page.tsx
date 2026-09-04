import { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetailContent from "./components/EventDetailContent";

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
            images: event.cover_image ? [{ url: event.cover_image }] : [],
        },
    };
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
    const event = await fetchEvent(params.slug);
    if (!event) notFound();
    return <EventDetailContent event={event} />;
}
