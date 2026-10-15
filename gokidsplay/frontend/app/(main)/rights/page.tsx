import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { LegalPage } from "@/components/LegalPage";
import { getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Your Rights | Go Kids Play",
    "Information regarding your data privacy rights at Go Kids Play."
);

export default async function RightsPage() {
    const content = await getPublicPageContent("legal-rights");
    return <LegalPage content={content} />;
}
