import { getRoles, getAdminUser } from "@/app/actions/users";
import { getAdminSession } from "@/app/lib/admin-auth";
import { redirect, notFound } from "next/navigation";
import { AdminUserForm } from "../../components/AdminUserForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditUserPage({ params }: { params: { id: string } }) {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const [user, roles] = await Promise.all([
        getAdminUser(params.id),
        getRoles()
    ]);

    if (!user) notFound();

    return (
        <div className="p-8">
            <div className="mb-8">
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Users
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Edit User</h1>
                <p className="text-slate-500 mt-1">Manage user details and permissions</p>
            </div>

            <AdminUserForm user={user} roles={roles} />
        </div>
    );
}
