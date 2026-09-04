import React from 'react';
import ContactContent from "./components/ContactContent";
import { getSettings } from "../../actions/settings";
import { siteConfig } from "@repo/config";
import { getPageSections } from "../../actions/page-sections";
import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Contact Us",
    "Get in touch with Go Kids Play Coventry. We'd love to hear from you — visit us, call us, or send a message. Find our address, opening hours and contact details here."
);

export default async function ContactPage() {
    const [settings, sections] = await Promise.all([
        getSettings() as any,
        getPageSections('contact')
    ]);

    const heroSection = sections.find((s: any) => s.section_key === 'hero');
    const formSection = sections.find((s: any) => s.section_key === 'contact_form');

    const heroData = heroSection ? {
        title: heroSection.title,
        subtitle: heroSection.subtitle,
        image: heroSection.image_url
    } : undefined;

    const formData = formSection ? {
        title: formSection.title,
        subtitle: formSection.subtitle
    } : undefined;

    return (
        <ContactContent
                settings={settings}
                defaultConfig={siteConfig}
                hero={heroData}
                form={formData}
            />
    );
}
