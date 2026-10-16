"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReservationsTable } from "../components/ReservationsTable";
import { RequestsPanel } from "../components/RequestsPanel";

/** All event reservations (paid at the venue) and customers' event requests. */
function ReservationsAndRequests() {
    const router = useRouter();
    const tab = useSearchParams().get("tab") === "requests" ? "requests" : "reservations";
    const [newRequests, setNewRequests] = useState(0);
    const show = (t: string) => router.replace(`/admin/events/reservations${t === "requests" ? "?tab=requests" : ""}`);

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-start gap-4">
                <Link href="/admin/events" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 mt-1"><ArrowLeft size={20} /></Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Reservations & Requests</h1>
                    <p className="text-slate-500 mt-1">Every special-event reservation (paid at the venue) and customers&apos; requests for us to organise an event.</p>
                </div>
            </div>

            <div className="flex gap-1 border-b border-slate-200">
                {[
                    { key: "reservations", label: "Reservations" },
                    { key: "requests", label: "Event Requests", badge: newRequests },
                ].map(t => (
                    <button key={t.key} onClick={() => show(t.key)}
                        className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px flex items-center gap-2 ${tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                        {t.label}
                        {!!t.badge && <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px]">{t.badge} new</span>}
                    </button>
                ))}
            </div>

            {/* Both stay mounted so the "new requests" badge is right on either tab */}
            <div className={tab === "reservations" ? "" : "hidden"}><ReservationsTable /></div>
            <div className={tab === "requests" ? "" : "hidden"}><RequestsPanel onCountChange={setNewRequests} /></div>
        </div>
    );
}

export default function ReservationsPage() {
    return (
        <Suspense fallback={null}>
            <ReservationsAndRequests />
        </Suspense>
    );
}
