import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { AttractionDetail } from "@/components/AttractionDetail";
import { getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Laser Arena Coventry",
    "Experience the ultimate laser tag battle at Go Kids Play Coventry. State-of-the-art equipment, multi-level arena, and immersive effects."
);

export default async function LaserArenaPage() {
    const content = await getPublicPageContent("attraction-laser-arena");
    return <AttractionDetail slug="laser-arena" content={content} />;
}
