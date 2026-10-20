import React from "react";
import { Navbar } from "../../features/navigation/Navbar";
import { Footer } from "../../components/Footer";
import { ToastProvider } from "../../components/ToastProvider";
import { MobileBottomNav } from "../../components/MobileBottomNav";
import { InstallAppBanner } from "../../components/InstallAppBanner";
import { CookieConsent } from "../../components/CookieConsent";
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
                    {/* Each page has its own <main> (one main landmark per page) */}
                    <div className="flex-grow pb-16 md:pb-0">
                        {settingsData?.maintenanceMode ? (
                            // Admin → Settings → Maintenance mode
                            <main className="min-h-[60vh] flex items-center justify-center px-4 pt-28 pb-16">
                                <div className="max-w-xl text-center">
                                    <div className="text-6xl mb-4">🛠️</div>
                                    <h1 className="text-3xl md:text-4xl font-black text-white mb-3">We&apos;ll be back soon</h1>
                                    <p className="text-white/70">
                                        Our website is having some maintenance. For bookings or questions please call{" "}
                                        <a href={`tel:${String(settings?.contactPhone || "").replace(/\s/g, "")}`} className="text-primary font-bold">{settings?.contactPhone}</a>
                                        {settings?.contactEmail && <> or email <a href={`mailto:${settings.contactEmail}`} className="text-primary font-bold">{settings.contactEmail}</a></>}.
                                    </p>
                                </div>
                            </main>
                        ) : children}
                    </div>
                    <Footer settings={settings} socialLinks={socialLinks} />
                    <MobileBottomNav />
                    <InstallAppBanner />
                    <CookieConsent />
                </div>
            </ToastProvider>
        </AccountProvider>
    );
}
