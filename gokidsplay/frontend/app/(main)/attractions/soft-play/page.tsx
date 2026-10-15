import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { AttractionDetail } from "@/components/AttractionDetail";
import { getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Soft Play Coventry",
    "Go Kids Play's Soft Play Zone in Coventry — a safe and exciting 3-tier soft play frame with toddler area, tunnels, slides and ball pits. Perfect for children of all ages."
);

export default async function SoftPlayPage() {
    const content = await getPublicPageContent("attraction-soft-play");
    return <AttractionDetail slug="soft-play" content={content} />;
}
