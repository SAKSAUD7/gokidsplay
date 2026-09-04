"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { BouncyButton } from "./BouncyButton";

export function InstallAppBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already dismissed in session
        if (sessionStorage.getItem("pwa-prompt-dismissed")) {
            setDismissed(true);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Check if app is already installed
        window.addEventListener("appinstalled", () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === "accepted") {
            setIsInstallable(false);
        }
        
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem("pwa-prompt-dismissed", "true");
    };

    if (!isInstallable || dismissed) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-[80px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[90] bg-[#1a0a35]/95 backdrop-blur-md border border-primary/30 shadow-neon-purple rounded-2xl p-4 flex items-center justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0 border border-primary/40">
                        <img src="/gokidsplay-logo.png" alt="App Icon" className="w-6 h-6 object-contain drop-shadow-neon-blue" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">Install Go Kids Play App</h4>
                        <p className="text-white/70 text-xs">Book faster & get exclusive offers!</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                    <button 
                        onClick={handleInstallClick}
                        className="bg-primary hover:bg-primary/90 text-black font-bold text-xs px-4 py-2 rounded-lg shadow-neon-blue transition-colors"
                    >
                        Install
                    </button>
                    <button 
                        onClick={handleDismiss}
                        className="text-white/50 hover:text-white p-1"
                        aria-label="Dismiss"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
