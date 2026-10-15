import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { LegalPage } from "@/components/LegalPage";
import { getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Security | Go Kids Play",
    "Security policies and procedures at Go Kids Play."
);

export default async function SecurityPage() {
    const content = await getPublicPageContent("legal-security");
    return <LegalPage content={content} />;
}
