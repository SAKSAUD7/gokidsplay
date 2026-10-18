import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import TestimoniesContent from "./components/TestimoniesContent";
import { GooglePhotos } from "@/components/GooglePhotos";
import { getPublicGoogleReviews, getPublicPageContent, getPublicTestimonials } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Customer Reviews | Go Kids Play Coventry",
    "Read what Coventry families say about Go Kids Play — reviews of our Soft Play, Laser Arena, Go Karts, Inflatable Park and birthday parties."
);

export default async function TestimoniesPage() {
    const [reviews, content, google] = await Promise.all([
        getPublicTestimonials(), getPublicPageContent("testimonies"), getPublicGoogleReviews(),
    ]);
    return (
        <>
            <TestimoniesContent reviews={reviews} content={content} google={google} />
            <div className="bg-background"><GooglePhotos photos={google?.photos} reviewsUrl={google?.reviews_url} /></div>
        </>
    );
}
