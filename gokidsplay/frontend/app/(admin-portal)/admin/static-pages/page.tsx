import { getStaticPages } from "@/app/actions/cms";
import { getAdminSession } from "../../../lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Eye, EyeOff } from "lucide-react";
import { StaticPageActions } from "../components/StaticPageActions";

export default async function StaticPagesPage() {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const pages = await getStaticPages();

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Static Pages</h1>
                    <p className="text-slate-500 mt-1">Manage About, Terms, Privacy and other static content pages</p>
                </div>
                <Link
                    href="/admin/static-pages/new"
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <Plus size={20} />
                    Add Page
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Page</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Updated</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pages.map((page) => (
                            <tr key={page.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="font-bold text-slate-900">{page.title}</p>
                                            {page.metaTitle && (
                                                <p className="text-xs text-slate-500">{page.metaTitle}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <code className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-mono">
                                        /{page.slug}
                                    </code>
                                </td>
                                <td className="px-6 py-4">
                                    {page.published ? (
                                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                            <Eye size={14} />
                                            Published
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                            <EyeOff size={14} />
                                            Draft
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {new Date(page.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <StaticPageActions page={page} />
                                </td>
                            </tr>
                        ))}
                        {pages.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No static pages found. Create your first page to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
