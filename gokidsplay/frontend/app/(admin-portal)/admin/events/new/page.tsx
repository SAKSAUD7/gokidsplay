"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EventForm } from "../components/EventForm";
import { typeInfo } from "../components/eventMeta";

/** New event; "Create event" on a customer's request pre-fills type, date and title. */
function NewEvent() {
    const sp = useSearchParams();
    const type = sp.get("event_type");
    const initial = type
        ? {
            event_type: type,
            emoji: typeInfo(type).emoji,
            accent_color: typeInfo(type).color,
            date: sp.get("date") || "",
            title: sp.get("title") || "",
            is_public: false, // a private event for the customer who asked
        }
        : undefined;
    return <EventForm initial={initial} fromRequestId={sp.get("from_request")} />;
}

export default function NewEventPage() {
    return (
        <Suspense fallback={null}>
            <NewEvent />
        </Suspense>
    );
}
