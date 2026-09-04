import { getAdminSession } from "@/app/lib/admin-auth";
import { getBookingById } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import { AdminBookingForm } from "@/app/(admin-portal)/admin/components/AdminBookingForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditBookingPage({ params }: { params: { id: string } }) {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const booking = await getBookingById(params.id);

    if (!booking) {
        return <div className="p-8">Booking not found</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/admin/bookings"
                    className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Bookings
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Edit Session Booking</h1>
                        <p className="text-slate-500 mt-1">Update details for Booking #{String(booking.id).padStart(6, '0')}</p>
                    </div>
                </div>
            </div>

            <AdminBookingForm initialData={booking} isEditing={true} />
        </div>
    );
}
