"use client";

import { useState, useEffect } from "react";
import { Download, Apple, Smartphone } from "lucide-react";
import { BouncyButton } from "./BouncyButton";

export function InstallAppSection() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setIsInstallable(false);
        }
        setDeferredPrompt(null);
    };

    return (
        <div className="mt-16 pt-12 border-t border-white/10 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-3xl bg-gradient-to-br from-primary to-secondary text-black shadow-neon-purple">
                <Smartphone className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-display font-black mb-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    Get the Go Kids Play App
                </span>
            </h3>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
                Install our official Web App on your home screen for lightning-fast bookings and exclusive mobile-only offers.
            </p>
            
            {isInstallable ? (
                <BouncyButton onClick={handleInstallClick} variant="primary" size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Install App Now
                </BouncyButton>
            ) : isIOS ? (
                <div className="bg-surface-800/50 border border-white/10 rounded-2xl p-6 text-left max-w-sm mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                        <Apple className="w-6 h-6 text-white" />
                        <h4 className="font-bold text-white">iOS Installation</h4>
                    </div>
                    <ol className="text-sm text-white/70 space-y-2 list-decimal list-inside">
                        <li>Tap the <strong>Share</strong> button at the bottom of Safari.</li>
                        <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                        <li>Tap <strong>"Add"</strong> in the top right corner.</li>
                    </ol>
                </div>
            ) : (
                <div className="bg-surface-800/50 border border-white/10 rounded-2xl p-6 max-w-sm mx-auto">
                    <p className="text-sm text-white/70">
                        To install the app, tap the menu in your browser and select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.
                    </p>
                </div>
            )}
        </div>
    );
}
