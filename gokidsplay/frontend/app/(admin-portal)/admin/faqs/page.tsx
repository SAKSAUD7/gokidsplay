import { getFaqs } from "@/app/actions/faqs";
import { Plus, Edit } from "lucide-react";
import Link from "next/link";
import { PermissionGate } from "../../../../components/PermissionGate";

export default async function FaqsPage() {
    const faqs = await getFaqs();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">FAQs</h1>
                    <p className="text-slate-500">Manage frequently asked questions</p>
                </div>
                <PermissionGate entity="cms" action="write">
                    <Link
                        href="/admin/faqs/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New FAQ
                    </Link>
                </PermissionGate>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-slate-500">Order</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Category</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Question</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Answer</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                            <th className="px-6 py-3 font-medium text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {faqs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No FAQs found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            faqs.map((faq) => (
                                <tr key={faq.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500">{faq.order}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                            {faq.category || "General"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{faq.question}</td>
                                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{faq.answer}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            faq.active
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-100 text-slate-600"
                                        }`}>
                                            {faq.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <PermissionGate entity="cms" action="write">
                                            <Link
                                                href={`/admin/faqs/${faq.id}`}
                                                className="inline-flex p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                        </PermissionGate>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
