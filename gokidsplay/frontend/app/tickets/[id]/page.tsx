import { getTicket } from "../../actions/bookings";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { TicketView } from "./components/TicketView";

export default async function TicketPage({ params }: { params: { id: string } }) {
    const booking = await getTicket(params.id);

    if (!booking) {
        notFound();
    }

    return <TicketView booking={booking} />;
}
