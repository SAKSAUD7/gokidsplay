import { getAdminSession } from "@/app/lib/admin-auth";
import { redirect } from "next/navigation";
import { CMSBackLink } from "@/components/admin/cms/CMSBackLink";
import PartyBookingEditor from "./components/PartyBookingEditor";

export default async function PartyBookingPage() {
    const session = await getAdminSession();
    if (!session) {
        redirect("/admin/login");
    }

    return (
        <div className="p-8">
            <CMSBackLink href="/admin/cms" label="Back to CMS Dashboard" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Party Booking Content</h1>
                <p className="text-slate-500 mt-1">Manage content for the party booking steps</p>
            </div>

            <PartyBookingEditor />
        </div>
    );
}
