import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { LegalPage } from "@/components/LegalPage";
import { getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Disclaimer | Go Kids Play",
    "Legal disclaimer for Go Kids Play Coventry."
);

export default async function DisclaimerPage() {
    const content = await getPublicPageContent("legal-disclaimer");
    return <LegalPage content={content} />;
}
