import React from 'react';
import PartyContent from "./components/PartyContent";
import { getMenuSections } from "../../actions/menu-sections";
import { getSettings } from "../../actions/settings";
import { getPublicPageContent } from "@/lib/public-api";
import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Go Kids Play Party Booking",
    "Book your ultimate birthday party or group event at Go Kids Play Coventry. We offer amazing packages including entry for participants, food, drinks, and a dedicated party host.",
    true
);

export default async function Parties() {
    // Fetch data
    const [menuSections, settings, content] = await Promise.all([
        getMenuSections(),
        getSettings(),
        getPublicPageContent('party-booking'),
    ]) as [any[], any, Awaited<ReturnType<typeof getPublicPageContent>>];

    return (
        <PartyContent
                menus={menuSections}
                settings={settings}
                content={content}
            />
    );
}
