"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../../features/navigation/Navbar";
import { Footer } from "@repo/ui";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<any>(null);
    const [socialLinks, setSocialLinks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadSettings() {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

                const [settingsRes, linksRes] = await Promise.all([
                    fetch(`${API_URL}/core/settings/`, { cache: 'no-store' }),
                    fetch(`${API_URL}/cms/social-links/`, { cache: 'no-store' })
                ]);

                if (settingsRes.ok && linksRes.ok) {
                    const settingsData = await settingsRes.json();
                    const linksData = await linksRes.json();

                    if (settingsData.length > 0) {
                        const s = settingsData[0];
                        setSettings({
                            parkName: s.park_name || "Go Kids Play",
                            contactPhone: s.contact_phone || "07349 110865",
                            contactEmail: s.contact_email || "info@gokidsplay.co.uk",
                            address: s.address || "",
                            mapUrl: s.map_url || "",
                            openingHours: s.opening_hours || {},
                        });
                    }

                    setSocialLinks(linksData.filter((l: any) => l.active));
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadSettings();
    }, []);

    // Use default settings while loading or if fetch failed
    const defaultSettings = {
        parkName: "Go Kids Play",
        contactPhone: "07349 110865",
        contactEmail: "info@gokidsplay.co.uk",
    };

    return (
        <>
            <Navbar settings={settings || defaultSettings} />
            <main className="flex-grow">
                {children}
            </main>
            <Footer settings={settings || defaultSettings} socialLinks={socialLinks} />
        </>
    );
}
