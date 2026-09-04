"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const hasAutoReloaded = useRef(false);

    useEffect(() => {
        console.error("Global catastrophic error caught:", error);

        // Chunk load failures happen when Next.js deploys new code — the browser
        // has cached old HTML referencing old chunk hashes that no longer exist.
        // A single hard reload always fixes this automatically.
        const isChunkError =
            error?.message?.includes("Loading chunk") ||
            error?.message?.includes("ChunkLoadError") ||
            error?.name === "ChunkLoadError";

        if (isChunkError && !hasAutoReloaded.current) {
            hasAutoReloaded.current = true;
            // Small delay so it doesn't loop instantly
            setTimeout(() => window.location.reload(), 500);
        }
    }, [error]);

    const isChunkError =
        error?.message?.includes("Loading chunk") ||
        error?.message?.includes("ChunkLoadError") ||
        error?.name === "ChunkLoadError";

    if (isChunkError) {
        // Show a brief "updating…" message while auto-reloading
        return (
            <html lang="en">
                <body className="bg-background text-white min-h-screen flex items-center justify-center p-4 font-sans">
                    <div className="max-w-md w-full text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <h1 className="text-2xl font-black mb-3">Updating…</h1>
                        <p className="text-white/60 text-sm">
                            We just deployed new improvements. Refreshing the page automatically…
                        </p>
                    </div>
                </body>
            </html>
        );
    }

    return (
        <html lang="en">
            <body className="bg-background text-white min-h-screen flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full text-center">
                    <div className="w-24 h-24 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                    </div>

                    <h1 className="text-3xl font-black mb-4">Something went wrong!</h1>

                    <p className="text-white/60 mb-8">
                        We&apos;re having trouble loading this section. Please try again.
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left text-sm font-mono text-red-300 overflow-hidden break-words">
                        {error.message || "Unknown Application Error"}
                        {error.digest && <div className="mt-2 text-white/30 text-xs">Digest: {error.digest}</div>}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-full hover:opacity-90 transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>

                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 transition"
                        >
                            <Home className="w-4 h-4" />
                            Return Home
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
