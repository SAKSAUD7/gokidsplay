import { getAdminSession } from "@/app/lib/admin-auth";
import { getPartyBookingById } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import { AdminPartyBookingForm } from "@/app/(admin-portal)/admin/components/AdminPartyBookingForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditPartyBookingPage({ params }: { params: { id: string } }) {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const booking = await getPartyBookingById(params.id);

    if (!booking) {
        return <div className="p-8">Booking not found</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/admin/party-bookings"
                    className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Party Bookings
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Edit Party Booking</h1>
                <p className="text-slate-500 mt-1">Update details for Booking #{String(booking.id).slice(-6).toUpperCase()}</p>
            </div>

            <AdminPartyBookingForm initialData={booking} isEditing={true} />
        </div>
    );
}
