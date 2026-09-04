import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";

export const metadata: Metadata = getMetadata(
    "Our Facilities",
    "Explore Go Kids Play Coventry's world-class facilities — Soft Play Zone, Laser Arena, Go Kart Track, Inflatable Park, café and party rooms. Something for every age!"
);

export default function FacilitiesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
