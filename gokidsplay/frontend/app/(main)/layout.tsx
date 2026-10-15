import React from "react";
import { Navbar } from "../../features/navigation/Navbar";
import { Footer } from "../../components/Footer";
import { ToastProvider } from "../../components/ToastProvider";
import { MobileBottomNav } from "../../components/MobileBottomNav";
import { InstallAppBanner } from "../../components/InstallAppBanner";
import { getSettings } from "@/app/actions/settings";
import { getPublicSocialLinks } from "@/lib/public-api";
import { AccountProvider } from "@/state/account/AccountContext";

export const dynamic = 'force-dynamic';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    // getSettings() returns the single site-settings record (camelCase) or null
    const [settingsData, socialLinksData] = await Promise.all([
        getSettings(),
        getPublicSocialLinks()
    ]) as [any, any[]];

    const settings = settingsData ? {
        parkName: settingsData.parkName,
        contactPhone: settingsData.contactPhone,
        contactEmail: settingsData.contactEmail,
        address: settingsData.address,
        mapUrl: settingsData.mapUrl,
        openingHours: settingsData.openingHours,
    } : undefined;

    const socialLinks = socialLinksData ? socialLinksData.filter((l: any) => l.active) : [];

    return (
        <AccountProvider>
            <ToastProvider>
                <div suppressHydrationWarning className="flex flex-col min-h-screen overflow-x-hidden">
                    <Navbar settings={settings} />
                    <main className="flex-grow pb-16 md:pb-0">
                        {children}
                    </main>
                    <Footer settings={settings} socialLinks={socialLinks} />
                    <MobileBottomNav />
                    <InstallAppBanner />
                </div>
            </ToastProvider>
        </AccountProvider>
    );
}
