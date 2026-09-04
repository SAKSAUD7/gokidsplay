import { getAdminSession } from "@/app/lib/admin-auth";
import { redirect } from "next/navigation";
import { CMSBackLink } from "@/components/admin/cms/CMSBackLink";
import AccountConfigEditor from "./components/AccountConfigEditor";

export default async function AccountConfigPage() {
    const session = await getAdminSession();
    if (!session) {
        redirect("/admin/login");
    }

    return (
        <div className="p-8">
            <CMSBackLink href="/admin/cms" label="Back to CMS Dashboard" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Customer Account Page Content</h1>
                <p className="text-slate-500 mt-1">Manage content for the /account/bookings page</p>
            </div>

            <AccountConfigEditor />
        </div>
    );
}
