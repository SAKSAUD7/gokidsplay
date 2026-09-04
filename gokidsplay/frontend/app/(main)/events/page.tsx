import { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import PublicEventsContent from "./components/PublicEventsContent";

export const metadata: Metadata = getMetadata(
    "Events & Special Parties | Go Kids Play Coventry",
    "Browse all upcoming special events at Go Kids Play Coventry — Birthday Parties, Christmas Parties, Halloween Events, Easter Fun and more. Book your spot today!",
    true
);

export const dynamic = "force-dynamic";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000/api/v1").replace("localhost", "127.0.0.1");

async function fetchPublicEvents() {
    try {
        const res = await fetch(`${API_URL}/bookings/public/events/`, { cache: "no-store" });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export default async function EventsPage() {
    const events = await fetchPublicEvents();
    return <PublicEventsContent events={events} />;
}
