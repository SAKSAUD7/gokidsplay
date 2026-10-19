import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";
import { AppDownload } from "./AppDownload";

export const metadata: Metadata = getMetadata(
    "Get the App | Go Kids Play Coventry",
    "Install the Go Kids Play app on Android or iPhone: book play sessions and parties in a couple of taps."
);

export default function AppPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-28 md:pt-32 pb-20 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <img src="/icons/icon-192.png" alt="" width={88} height={88} className="w-[88px] h-[88px] mx-auto rounded-3xl mb-5 shadow-neon-purple" />
                    <h1 className="text-3xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        Get the Go Kids Play app
                    </h1>
                    <p className="text-white/70 md:text-lg">Book play sessions and parties in a couple of taps, and keep your tickets on your phone.</p>
                </div>
                <AppDownload />
            </div>
        </main>
    );
}
