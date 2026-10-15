import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { getFacilityItems } from "@/app/actions/facility-items";
import FacilitiesContent from "./components/FacilitiesContent";
import { getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Facilities | Go Kids Play Coventry",
    "Explore the on-site facilities at Go Kids Play Coventry including our café, free parking, baby changing areas, party rooms, secure entry, and free Wi-Fi."
);

export const dynamic = 'force-dynamic';

export default async function FacilitiesPage() {
    const [facilitiesRaw, content] = await Promise.all([
        getFacilityItems() as Promise<any[]>,
        getPublicPageContent('facilities'),
    ]);


    const facilities = facilitiesRaw
        .filter((f: any) => f.active !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    return <FacilitiesContent facilities={facilities} content={content} />;
}
