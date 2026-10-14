import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { getGalleryItems } from "@/app/actions/gallery";
import GalleryContent from "./components/GalleryContent";

export const metadata: Metadata = getMetadata(
    "Gallery | Go Kids Play Coventry",
    "Browse photos of Go Kids Play Coventry — our indoor play centre featuring Soft Play, Laser Arena, Go Karts, Inflatable Park and amazing Birthday Parties."
);

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
    const galleryRaw = await getGalleryItems();

    // Filter active items, exclude party carousel, sort by order
    const gallery = galleryRaw
        .filter((g: any) => g.active !== false && g.category !== 'parties_carousel')
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    return <GalleryContent cmsImages={gallery} />;
}
