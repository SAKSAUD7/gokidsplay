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
    const [settingsData, socialLinksData] = await Promise.all([
        getSettings(),
        getPublicSocialLinks()
    ]) as [any[], any[]];

    const settings = settingsData && settingsData.length > 0 ? {
        parkName: settingsData[0].park_name,
        contactPhone: settingsData[0].contact_phone,
        contactEmail: settingsData[0].contact_email,
        address: settingsData[0].address,
        mapUrl: settingsData[0].map_url,
        openingHours: settingsData[0].opening_hours,
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
