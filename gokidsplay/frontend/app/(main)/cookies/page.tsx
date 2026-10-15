import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { LegalPage } from "@/components/LegalPage";
import { getPublicPageContent } from "@/lib/public-api";

export const metadata: Metadata = getMetadata(
    "Cookie Policy | Go Kids Play",
    "Cookie Policy for Go Kids Play Coventry."
);

export default async function CookiesPage() {
    const content = await getPublicPageContent("legal-cookies");
    return <LegalPage content={content} />;
}
