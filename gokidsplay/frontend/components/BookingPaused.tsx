import Link from "next/link";
import { Phone } from "lucide-react";

/** Shown instead of a booking wizard when Admin → Settings has paused online booking. */
export function BookingPaused({ what, phone }: { what: string; phone?: string }) {
    const tel = (phone || "").replace(/\s/g, "");
    return (
        <div className="max-w-xl mx-auto text-center bg-surface-800/50 border border-white/10 rounded-2xl p-8 md:p-10">
            <div className="text-5xl mb-4">⏸️</div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Online {what} is paused</h2>
            <p className="text-white/70 mb-6">
                We&apos;re not taking {what} online at the moment. Please give us a call and we&apos;ll be happy to help.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
                {phone && (
                    <a href={`tel:${tel}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-bold">
                        <Phone className="w-4 h-4" /> {phone}
                    </a>
                )}
                <Link href="/contact" className="inline-flex items-center px-6 py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5">
                    Contact us
                </Link>
            </div>
        </div>
    );
}
