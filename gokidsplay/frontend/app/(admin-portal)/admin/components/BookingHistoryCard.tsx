"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";

interface Change {
    id: number;
    field_changed: string;
    old_value: string | null;
    new_value: string | null;
    changed_by: string | null;
    timestamp: string;
}

const LABELS: Record<string, string> = {
    date: "Date", time: "Time", "change fee": "Change fee", booking_status: "Status", status: "Status",
    payment_status: "Payment", arrived: "Arrived",
};

/**
 * Everything changed on a booking after it was made: date moves (by the customer in
 * My Account or by staff), status and payment changes. Newest first.
 */
export function BookingHistoryCard({ bookingId, bookingType, refreshKey }: {
    bookingId: number; bookingType: "session" | "party"; refreshKey?: unknown;
}) {
    const [changes, setChanges] = useState<Change[] | null>(null);

    useEffect(() => {
        fetch(`/api/bookings/${bookingId}/audit_log?type=${bookingType.toUpperCase()}`, { credentials: "include", cache: "no-store" })
            .then(r => (r.ok ? r.json() : []))
            .then(data => setChanges(Array.isArray(data) ? data : data.results || []))
            .catch(() => setChanges([]));
    }, [bookingId, bookingType, refreshKey]);

    if (!changes || changes.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" /> Change history
            </h2>
            <ul className="divide-y divide-slate-100">
                {changes.map(change => {
                    const byCustomer = (change.changed_by || "").startsWith("Customer");
                    return (
                        <li key={change.id} className="py-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                            <span className="font-semibold text-slate-700 w-24">{LABELS[change.field_changed] || change.field_changed}</span>
                            <span className="text-slate-600">
                                {change.old_value ? <><span className="line-through text-slate-400">{change.old_value}</span> → </> : null}
                                <span className="font-medium text-slate-900">{change.new_value}</span>
                            </span>
                            <span className="ml-auto text-xs text-slate-400">
                                <span className={`px-1.5 py-0.5 rounded font-semibold ${byCustomer ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                                    {change.changed_by || "Staff"}
                                </span>
                                {" "}{new Date(change.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
