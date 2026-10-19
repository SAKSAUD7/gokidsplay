"use client";

import { CheckCircle2, Download, PlusSquare, Share, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/lib/pwa";

// The Android app (Trusted Web Activity) built from gokidsplay/android, see android/README.md
const APK_URL = "/downloads/gokidsplay.apk";
const APK_INFO = "Version 1.0.0 · 1.9 MB · Android 7 or newer";

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <section className="rounded-3xl border border-white/10 bg-surface-800/50 p-5 md:p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-4"><Icon className="w-6 h-6 text-primary" /> {title}</h2>
            {children}
        </section>
    );
}

function Steps({ items }: { items: React.ReactNode[] }) {
    return (
        <ol className="space-y-2.5">
            {items.map((item, i) => (
                <li key={i} className="flex gap-3 text-white/80 text-sm md:text-base">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">{i + 1}</span>
                    <span className="pt-0.5">{item}</span>
                </li>
            ))}
        </ol>
    );
}

function AndroidCard({ canInstall, install }: { canInstall: boolean; install: () => Promise<boolean> }) {
    return (
        <Card title="Android" icon={Smartphone}>
            <a href={APK_URL} download
                className="flex items-center justify-center gap-2 w-full sm:w-auto sm:inline-flex bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg">
                <Download className="w-5 h-5" /> Download the Android app
            </a>
            <p className="text-xs text-white/50 mt-2 mb-5">{APK_INFO}</p>
            <Steps items={[
                <>Tap <strong>Download the Android app</strong> and wait for it to finish.</>,
                <>Open the downloaded file (from the notification, or the <strong>Downloads</strong> folder).</>,
                <>The first time, Android asks to allow installs from your browser: tap <strong>Settings</strong>, turn on <strong>Allow from this source</strong>, then go back.</>,
                <>Tap <strong>Install</strong>, then <strong>Open</strong>. Go Kids Play is now on your home screen.</>,
            ]} />
            <div className="mt-5 pt-5 border-t border-white/10 text-sm text-white/65">
                {canInstall ? (
                    <>Prefer not to download a file?{" "}
                        <button onClick={install} className="font-semibold text-primary underline underline-offset-2">Install from the browser instead</button>
                        {" "}(one tap, same app).</>
                ) : (
                    <>Prefer not to download a file? In Chrome, open the menu (⋮) and tap <strong className="text-white">Install app</strong>. It&apos;s the same app.</>
                )}
            </div>
        </Card>
    );
}

function IphoneCard() {
    return (
        <Card title="iPhone and iPad" icon={Smartphone}>
            <Steps items={[
                <>Open <strong>gokidsplay.co.uk</strong> in <strong>Safari</strong>.</>,
                <>Tap the <strong>Share</strong> button <Share className="inline w-4 h-4 -mt-1" aria-label="Share" />.</>,
                <>Choose <strong>Add to Home Screen</strong> <PlusSquare className="inline w-4 h-4 -mt-1" aria-hidden />, then <strong>Add</strong>.</>,
            ]} />
        </Card>
    );
}

export function AppDownload() {
    const { mode, platform, install } = usePwaInstall();

    if (mode === "loading") return <div className="h-64" aria-hidden />;
    if (mode === "installed") {
        return (
            <p className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 font-semibold p-5">
                <CheckCircle2 className="w-5 h-5" /> You&apos;re already using the Go Kids Play app.
            </p>
        );
    }
    const android = <AndroidCard canInstall={mode === "prompt"} install={install} />;
    if (mode === "ios") return <div className="space-y-5"><IphoneCard /></div>;
    if (mode === "android" || platform === "android") return <div className="space-y-5">{android}</div>;
    // Computer (or Chrome offering installation): show every option
    return (
        <div className="space-y-5">
            {mode === "prompt" && (
                <button onClick={install}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 text-primary font-bold p-4 hover:bg-primary/20">
                    <Download className="w-5 h-5" /> Install on this device
                </button>
            )}
            {android}
            <IphoneCard />
        </div>
    );
}
