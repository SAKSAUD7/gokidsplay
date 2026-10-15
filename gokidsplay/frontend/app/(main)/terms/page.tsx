import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { LegalPage } from "@/components/LegalPage";
import { getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Terms of Service | Go Kids Play",
    "Terms and Conditions of Service for Go Kids Play Coventry."
);

export default async function TermsPage() {
    const content = await getPublicPageContent("legal-terms");
    return <LegalPage content={content} />;
}
