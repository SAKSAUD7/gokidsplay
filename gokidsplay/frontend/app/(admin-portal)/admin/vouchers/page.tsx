import { getVouchers, deleteVoucher } from "@/app/actions/vouchers";
import Link from "next/link";
import { Plus, Ticket, Trash2, Edit } from "lucide-react";
import { Suspense } from "react";
import { ListSearchInput } from "@/components/admin/ListSearchInput";

export default async function VouchersPage({ searchParams }: { searchParams?: { search?: string } }) {
    const allVouchers = await getVouchers();
    // ?search= code or description
    const q = (searchParams?.search || "").trim().toLowerCase();
    const vouchers = q
        ? allVouchers.filter((v: any) => [v.code, v.description].some((x: any) => String(x || "").toLowerCase().includes(q)))
        : allVouchers;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Vouchers</h1>
                    <p className="text-slate-500 mt-1">Manage discount codes and promotions</p>
                </div>
                <Link href="/admin/vouchers/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                    <Plus size={20} />
                    Create Voucher
                </Link>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <Suspense fallback={null}><ListSearchInput placeholder="Search voucher codes…" /></Suspense>
                {q && <span className="text-sm text-slate-500">{vouchers.length} of {allVouchers.length} vouchers</span>}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Discount</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usage</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vouchers.length > 0 ? (
                            vouchers.map((voucher) => (
                                <tr key={voucher.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                                                <Ticket size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{voucher.code}</p>
                                                <p className="text-xs text-slate-500">{voucher.description || "No description"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-700">
                                            {voucher.discountType === "PERCENTAGE" ? `${voucher.discountValue}%` : `£${voucher.discountValue}`}
                                        </span>
                                        {voucher.minOrderAmount && (
                                            <p className="text-xs text-slate-500">Min: £{voucher.minOrderAmount}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {voucher.usedCount} / {voucher.usageLimit || "∞"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${voucher.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                            {voucher.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <Link href={`/admin/vouchers/${voucher.id}`} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                            <Edit size={18} />
                                        </Link>
                                        <form action={async () => {
                                            "use server";
                                            await deleteVoucher(voucher.id);
                                        }}>
                                            <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No vouchers found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
