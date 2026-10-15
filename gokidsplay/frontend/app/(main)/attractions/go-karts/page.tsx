import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { AttractionDetail } from "@/components/AttractionDetail";
import { getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Indoor Go Karts Coventry",
    "Race to the finish line on our indoor Go Kart track at Go Kids Play Coventry. Safe, electric karts perfect for young racers."
);

export default async function GoKartsPage() {
    const content = await getPublicPageContent("attraction-go-karts");
    return <AttractionDetail slug="go-karts" content={content} />;
}
