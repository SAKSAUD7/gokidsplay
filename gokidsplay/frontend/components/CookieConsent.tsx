"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

// Remembers the visitor's choice; Google Analytics stays in "denied" consent
// mode (no analytics cookies) until the visitor accepts.
const STORAGE_KEY = "gkp-cookie-consent";

type Choice = "accepted" | "rejected";

function applyConsent(choice: Choice) {
    const w = window as any;
    if (typeof w.gtag === "function") {
        w.gtag("consent", "update", {
            analytics_storage: choice === "accepted" ? "granted" : "denied",
        });
    }
}

export function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let saved: string | null = null;
        try {
            saved = localStorage.getItem(STORAGE_KEY);
        } catch { }
        if (saved === "accepted" || saved === "rejected") {
            applyConsent(saved);
        } else {
            setVisible(true);
        }
    }, []);

    const choose = (choice: Choice) => {
        try {
            localStorage.setItem(STORAGE_KEY, choice);
        } catch { }
        applyConsent(choice);
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            className="fixed bottom-[80px] md:bottom-6 left-4 right-4 md:right-auto md:left-6 md:w-[26rem] z-[95] bg-[#1a0a35]/95 backdrop-blur-md border border-white/15 shadow-2xl rounded-2xl p-4"
        >
            <div className="flex items-start gap-3">
                <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/80 leading-relaxed">
                    We use essential cookies to run the site and, with your permission, analytics cookies to
                    understand how it is used.{" "}
                    <Link href="/cookies" className="text-primary underline underline-offset-2">Cookie policy</Link>
                </p>
            </div>
            <div className="flex gap-2 mt-3 justify-end">
                <button
                    type="button"
                    onClick={() => choose("rejected")}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
                >
                    Essential only
                </button>
                <button
                    type="button"
                    onClick={() => choose("accepted")}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 transition-opacity"
                >
                    Accept all
                </button>
            </div>
        </div>
    );
}
