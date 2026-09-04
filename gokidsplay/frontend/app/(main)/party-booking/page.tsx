import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { getPageSections } from "../../actions/page-sections";
import PartyBookingWizard from "./PartyBookingWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getMetadata(
    "Book a Birthday Party",
    "Book an unforgettable kids birthday party at Go Kids Play Coventry. Choose from our party packages — includes play time, party room, food & drinks. Book online today!"
);


export default async function PartyBookingPage() {
    const cmsContent = await getPageSections('booking-party');
    return <PartyBookingWizard cmsContent={cmsContent} />;
}
