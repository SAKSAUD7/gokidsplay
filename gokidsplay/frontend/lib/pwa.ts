"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * "Install the Go Kids Play app" (web app / PWA).
 *
 * Chrome, Edge and Samsung Internet offer installation through a
 * `beforeinstallprompt` event that fires once, early in page load. A tiny script
 * in app/layout.tsx stores it on window.__gkpInstallPrompt before React starts,
 * so it is never missed; this hook reads it from there.
 *
 * iPhone/iPad have no install button: people use Share → Add to Home Screen,
 * so the hook says which instructions to show.
 */
export type InstallMode =
    | "loading"     // not known yet (server render / first paint)
    | "installed"   // already running as the installed app
    | "prompt"      // the browser can show its install window: show an Install button
    | "ios"         // iPhone / iPad: Share → Add to Home Screen
    | "android"     // Android browser without an install event: ⋮ menu → Install app
    | "desktop";    // computer browser without an install event

declare global {
    interface Window {
        __gkpInstallPrompt?: any;
    }
}

function isStandalone() {
    return window.matchMedia?.("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}

export type Platform = "android" | "ios" | "desktop";

function platformOf(): Platform {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
    return /Android/i.test(ua) ? "android" : "desktop";
}

function detect(): InstallMode {
    if (isStandalone()) return "installed";
    if (window.__gkpInstallPrompt) return "prompt";
    return platformOf();
}

export function usePwaInstall() {
    const [mode, setMode] = useState<InstallMode>("loading");
    const [platform, setPlatform] = useState<Platform>("desktop");

    useEffect(() => {
        const update = () => setMode(detect());
        update();
        setPlatform(platformOf());
        window.addEventListener("gkp-installable", update);
        window.addEventListener("appinstalled", update);
        const standalone = window.matchMedia?.("(display-mode: standalone)");
        standalone?.addEventListener?.("change", update);
        return () => {
            window.removeEventListener("gkp-installable", update);
            window.removeEventListener("appinstalled", update);
            standalone?.removeEventListener?.("change", update);
        };
    }, []);

    /** Opens the browser's install window. Returns true if the person installed. */
    const install = useCallback(async () => {
        const prompt = window.__gkpInstallPrompt;
        if (!prompt) return false;
        prompt.prompt();
        const choice = await prompt.userChoice.catch(() => ({ outcome: "dismissed" }));
        window.__gkpInstallPrompt = undefined;   // each install window can only be used once
        setMode(choice.outcome === "accepted" ? "installed" : detect());
        return choice.outcome === "accepted";
    }, []);

    return { mode, platform, install };
}
