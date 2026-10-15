import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { LegalPage } from "@/components/LegalPage";
import { getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Privacy Policy | Go Kids Play",
    "Privacy Policy for Go Kids Play Coventry."
);

export default async function PrivacyPage() {
    const content = await getPublicPageContent("legal-privacy");
    return <LegalPage content={content} />;
}
