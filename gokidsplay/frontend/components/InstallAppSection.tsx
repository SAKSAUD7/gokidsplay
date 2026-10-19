"use client";

import { CheckCircle2, Download, MoreVertical, PlusSquare, Share } from "lucide-react";
import Link from "next/link";
import { usePwaInstall } from "@/lib/pwa";

/** Home page: a slim "Get the app" card with the right install option for this device. */
export function InstallAppSection() {
    const { mode, platform, install } = usePwaInstall();
    if (mode === "loading") return <div className="mt-10 h-[88px]" aria-hidden />;

    return (
        <div className="mt-10 mb-16 md:mb-20 max-w-3xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 text-center sm:text-left">
                <img src="/icons/icon-192.png" alt="" width={56} height={56} className="w-14 h-14 rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-display font-black text-lg leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Get the Go Kids Play app</span>
                    </h3>
                    <p className="text-white/65 text-sm mt-0.5">Book in a couple of taps and keep your tickets on your home screen. Free, no app store.</p>
                </div>
                <div className="shrink-0 text-sm text-white/75">
                    {mode === "installed" && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold"><CheckCircle2 className="w-4 h-4" /> Installed</span>
                    )}
                    {mode === "prompt" && (
                        <button onClick={install}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg">
                            <Download className="w-4 h-4" /> Install app
                        </button>
                    )}
                    {mode === "ios" && (
                        <span>Tap <Share className="inline w-4 h-4 -mt-0.5" aria-label="Share" /> then <strong className="text-white">Add to Home Screen</strong> <PlusSquare className="inline w-4 h-4 -mt-0.5" aria-hidden /></span>
                    )}
                    {mode === "android" && (
                        <span>Tap <MoreVertical className="inline w-4 h-4 -mt-0.5" aria-label="menu" /> then <strong className="text-white">Install app</strong></span>
                    )}
                    {mode === "desktop" && (
                        <span>Open <strong className="text-white">gokidsplay.co.uk</strong> on your phone</span>
                    )}
                    {mode !== "installed" && (
                        <Link href="/app" className="block mt-1.5 text-xs font-semibold text-primary underline underline-offset-2">
                            {platform === "android" ? "Download the Android app (APK)" : "All install options"}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
