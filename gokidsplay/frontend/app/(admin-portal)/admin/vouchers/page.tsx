import { getVouchers } from "@/app/actions/vouchers";
import Link from "next/link";
import { Plus, Ticket, Wand2 } from "lucide-react";
import { Suspense } from "react";
import { ListSearchInput } from "@/components/admin/ListSearchInput";
import { VoucherStatusBadge } from "./VoucherStatusBadge";
import { VoucherRowActions } from "./VoucherRowActions";

const STATUSES = ["All", "Active", "Scheduled", "Expired", "Used up", "Off"];
const WORKS_ON: Record<string, string> = { ALL: "Sessions & parties", SESSION: "Sessions only", PARTY: "Parties only" };

const ukDay = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric" }) : "";

export default async function VouchersPage({ searchParams }: { searchParams?: { search?: string; status?: string } }) {
    const allVouchers = await getVouchers();
    // ?search= code, description or batch · ?status= Active / Scheduled / Expired / Used up / Off
    const q = (searchParams?.search || "").trim().toLowerCase();
    const status = STATUSES.includes(searchParams?.status || "") ? searchParams!.status! : "All";
    const vouchers = allVouchers.filter((v: any) =>
        (!q || [v.code, v.description, v.batch].some((x: any) => String(x || "").toLowerCase().includes(q))) &&
        (status === "All" || v.status === status));
    const count = (s: string) => allVouchers.filter((v: any) => s === "All" || v.status === s).length;
    const qs = (s: string) => {
        const p = new URLSearchParams();
        if (q) p.set("search", searchParams?.search || "");
        if (s !== "All") p.set("status", s);
        const str = p.toString();
        return str ? `?${str}` : "";
    };

    return (
        <div className="p-8">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Vouchers</h1>
                    <p className="text-slate-500 mt-1">Discount codes for play sessions and parties. Uses are tracked per booking.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/vouchers/generate" className="border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                        <Wand2 size={18} /> Generate codes
                    </Link>
                    <Link href="/admin/vouchers/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                        <Plus size={20} /> Create Voucher
                    </Link>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4">
                <Suspense fallback={null}><ListSearchInput placeholder="Search code, description or batch…" /></Suspense>
                <nav className="flex flex-wrap gap-1" aria-label="Filter by status">
                    {STATUSES.map(s => (
                        <Link key={s} href={`/admin/vouchers${qs(s)}`}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${status === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                            {s} <span className="opacity-60">{count(s)}</span>
                        </Link>
                    ))}
                </nav>
                {(q || status !== "All") && <span className="text-sm text-slate-500">{vouchers.length} of {allVouchers.length} vouchers</span>}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Discount</th>
                            <th className="px-6 py-4">Rules</th>
                            <th className="px-6 py-4">Used</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vouchers.length > 0 ? vouchers.map((v: any) => (
                            <tr key={v.id} className="hover:bg-slate-50 align-top">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-violet-100 rounded-lg text-violet-600"><Ticket size={18} /></div>
                                        <div>
                                            <Link href={`/admin/vouchers/${v.id}`} className="font-bold font-mono text-slate-900 hover:text-blue-600">{v.code}</Link>
                                            <p className="text-xs text-slate-500">{v.description || "No description"}</p>
                                            {v.batch && <p className="text-xs text-slate-400">Batch {v.batch}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-slate-700">
                                        {v.discountType === "PERCENTAGE" ? `${Number(v.discountValue)}%` : `£${Number(v.discountValue).toFixed(2)}`}
                                    </span>
                                    {v.discountType === "PERCENTAGE" && v.maxDiscountAmount && (
                                        <p className="text-xs text-slate-500">up to £{Number(v.maxDiscountAmount).toFixed(2)}</p>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-600 space-y-0.5">
                                    <p>{WORKS_ON[v.appliesTo] || WORKS_ON.ALL}</p>
                                    {v.minOrderAmount && <p>Min spend £{Number(v.minOrderAmount).toFixed(2)}</p>}
                                    {v.maxUsesPerCustomer && <p>{v.maxUsesPerCustomer}× per customer</p>}
                                    {v.minHoursBeforeSlot > 0 && <p>Book {v.minHoursBeforeSlot}h ahead</p>}
                                    {v.validFrom && <p>From {ukDay(v.validFrom)}</p>}
                                    {v.expiryDate && <p>Until {ukDay(v.expiryDate)}</p>}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {v.usedCount} / {v.usageLimit || "∞"}
                                    {Number(v.totalDiscountGiven) > 0 && <p className="text-xs text-slate-500">£{Number(v.totalDiscountGiven).toFixed(2)} off given</p>}
                                </td>
                                <td className="px-6 py-4"><VoucherStatusBadge status={v.status} /></td>
                                <td className="px-6 py-4"><VoucherRowActions id={String(v.id)} code={v.code} isActive={!!v.isActive} /></td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    {allVouchers.length ? "No vouchers match." : "No vouchers yet. Create one to get started."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
