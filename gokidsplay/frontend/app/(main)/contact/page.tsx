import React from 'react';
import ContactContent from "./components/ContactContent";
import { getSettings } from "../../actions/settings";
import { getPublicPageContent, getPublicTimingCards } from "@/lib/public-api";
import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Contact Us",
    "Get in touch with Go Kids Play Coventry. We'd love to hear from you — visit us, call us, or send a message. Find our address, opening hours and contact details here."
);

export default async function ContactPage() {
    const [settings, content, hours] = await Promise.all([
        getSettings(),
        getPublicPageContent('contact'),
        getPublicTimingCards(),
    ]);

    return <ContactContent settings={settings} content={content} hours={hours} />;
}
