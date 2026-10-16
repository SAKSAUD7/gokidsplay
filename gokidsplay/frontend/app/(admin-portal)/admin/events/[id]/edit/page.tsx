"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { EventForm } from "../../components/EventForm";

export default function EditEventPage({ params }: { params: { id: string } }) {
    const [event, setEvent] = useState<any>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        fetch(`/api/events?id=${params.id}`, { credentials: "include", cache: "no-store" })
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(setEvent)
            .catch(() => setFailed(true));
    }, [params.id]);

    if (failed) {
        return (
            <div className="p-8 text-slate-600">
                Event not found. <Link href="/admin/events" className="text-blue-600 font-semibold">Back to events</Link>
            </div>
        );
    }
    if (!event) {
        return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }
    return <EventForm eventId={params.id} initial={event} />;
}
