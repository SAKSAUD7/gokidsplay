import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { AttractionDetail } from "@/components/AttractionDetail";
import { getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Inflatable Park Coventry",
    "Bounce, slide and play at Go Kids Play's massive indoor inflatable park in Coventry. Featuring obstacle courses, wipeout challenges, and drops."
);

export default async function InflatableParkPage() {
    const content = await getPublicPageContent("attraction-inflatable-park");
    return <AttractionDetail slug="inflatable-park" content={content} />;
}
