import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { getPageSections } from "../../actions/page-sections";
import PartyBookingWizard from "./PartyBookingWizard";
import { getPublicHoursText } from "@/lib/public-api";
import { fillHours } from "@/lib/hours-text";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getMetadata(
    "Book a Birthday Party",
    "Book an unforgettable kids birthday party at Go Kids Play Coventry. Choose from our party packages — includes play time, party room, food & drinks. Book online today!"
);


export default async function PartyBookingPage() {
    const cmsContent = fillHours(await getPageSections('booking-party'), await getPublicHoursText());
    return <PartyBookingWizard cmsContent={cmsContent} />;
}
