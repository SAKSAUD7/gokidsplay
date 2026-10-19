"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PlusSquare, Share, X } from "lucide-react";
import { usePwaInstall } from "@/lib/pwa";

const DISMISS_KEY = "gkp-install-dismissed";
const DISMISS_DAYS = 14;
// Never cover the booking wizards, checkout or account screens
const QUIET_PATHS = [/^\/book/, /^\/party-booking/, /^\/booking/, /^\/account/, /^\/invitations?/];

function read(key: string) {
    try { return localStorage.getItem(key); } catch { return null; }
}

/**
 * The "Install the app" pop-up: on phones a card above the bottom menu (Android Install button /
 * iPhone Add to Home Screen hint); on computers a card bottom-right when Chrome or Edge can install.
 */
export function InstallAppBanner() {
    const { mode, install } = usePwaInstall();
    const pathname = usePathname() || "/";
    const [ready, setReady] = useState(false);
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        const dismissedAt = Number(read(DISMISS_KEY) || 0);
        setHidden(Date.now() - dismissedAt < DISMISS_DAYS * 86400000);
        // Wait until the cookie choice has been made and the visitor has looked around for a bit
        const timer = window.setInterval(() => {
            if (read("gkp-cookie-consent")) { setReady(true); window.clearInterval(timer); }
        }, 4000);
        return () => window.clearInterval(timer);
    }, []);

    const dismiss = () => {
        setHidden(true);
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
    };

    const show = ready && !hidden && (mode === "prompt" || mode === "ios") && !QUIET_PATHS.some(re => re.test(pathname));

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    role="dialog" aria-label="Install the Go Kids Play app"
                    initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                    className="fixed left-3 right-3 z-[60] bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:left-auto md:right-6 md:bottom-6 md:w-96 bg-[#1a0a35]/95 backdrop-blur-md border border-primary/30 shadow-neon-purple rounded-2xl p-3 flex items-center gap-3"
                >
                    <img src="/icons/icon-192.png" alt="" width={44} height={44} className="w-11 h-11 rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm leading-tight">Get the Go Kids Play app</p>
                        {mode === "ios" ? (
                            <p className="text-white/70 text-xs leading-snug mt-0.5">
                                Tap <Share className="inline w-3.5 h-3.5 -mt-0.5" aria-label="Share" /> then
                                {" "}<strong>Add to Home Screen</strong> <PlusSquare className="inline w-3.5 h-3.5 -mt-0.5" aria-hidden />
                            </p>
                        ) : (
                            <p className="text-white/70 text-xs leading-snug mt-0.5">Book faster from your home screen</p>
                        )}
                    </div>
                    {mode === "prompt" && (
                        <button onClick={async () => { if (!(await install())) dismiss(); }}
                            className="bg-primary hover:bg-primary/90 text-black font-bold text-sm px-4 py-2.5 rounded-xl shrink-0">
                            Install
                        </button>
                    )}
                    <button onClick={dismiss} className="text-white/60 hover:text-white p-2 -mr-1 shrink-0" aria-label="Not now">
                        <X className="w-5 h-5" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
