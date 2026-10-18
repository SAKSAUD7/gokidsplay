import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { getPageSections } from "../../actions/page-sections";
import PartyBookingWizard from "./PartyBookingWizard";
import { getPublicHoursText } from "@/lib/public-api";
import { fillHours } from "@/lib/hours-text";
import { getSettings } from "../../actions/settings";
import { BookingPaused } from "@/components/BookingPaused";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getMetadata(
    "Book a Birthday Party",
    "Book an unforgettable kids birthday party at Go Kids Play Coventry. Choose from our party packages — includes play time, party room, food & drinks. Book online today!"
);


export default async function PartyBookingPage() {
    const site: any = await getSettings();
    if (site && site.partyBookingsEnabled === false) {
        return <main className="min-h-screen pt-28 pb-16 px-4"><BookingPaused what="party booking" phone={site.contactPhone} /></main>;
    }
    const cmsContent = fillHours(await getPageSections('booking-party'), await getPublicHoursText());
    return <PartyBookingWizard cmsContent={cmsContent} />;
}
