import { redirect } from "next/navigation";

/** Old link — session bookings are shown at /admin/bookings/[id] (with their payments). */
export default function SessionBookingDetailRedirect({ params }: { params: { id: string } }) {
    redirect(`/admin/bookings/${encodeURIComponent(params.id)}`);
}
