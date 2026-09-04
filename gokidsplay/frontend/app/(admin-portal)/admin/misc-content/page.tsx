import { getGalleryItems } from "@/app/actions/gallery";
import { Plus, Edit } from "lucide-react";
import Link from "next/link";
import { PermissionGate } from "../../../../components/PermissionGate";

export default async function GalleryPage() {
    const items = await getGalleryItems();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gallery Items</h1>
                    <p className="text-slate-500">Manage photo gallery content</p>
                </div>
                <PermissionGate entity="cms" action="write">
                    <Link
                        href="/admin/misc-content/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New Item
                    </Link>
                </PermissionGate>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-slate-500">Order</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Image</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Title</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Category</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                            <th className="px-6 py-3 font-medium text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No gallery items found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500">{item.order}</td>
                                    <td className="px-6 py-4">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden relative">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.title}</td>
                                    <td className="px-6 py-4 text-slate-500">{item.category}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.active
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-slate-100 text-slate-600"
                                            }`}>
                                            {item.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <PermissionGate entity="cms" action="write">
                                            <Link
                                                href={`/admin/misc-content/${item.id}`}
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
