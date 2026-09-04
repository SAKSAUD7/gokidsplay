import { AdminPartyBookingForm } from "../../components/AdminPartyBookingForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewPartyBookingPage() {
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
                <h1 className="text-3xl font-bold text-slate-900">Manual Party Booking</h1>
                <p className="text-slate-500 mt-1">Create a party booking for walk-in or phone customers</p>
            </div>

            <AdminPartyBookingForm />
        </div>
    );
}
