"use client";

import { useEffect, useState } from "react";
import { getVoucher, getVoucherRedemptions, updateVoucher } from "@/app/actions/vouchers";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { VoucherForm } from "../VoucherForm";
import { VoucherStatusBadge } from "../VoucherStatusBadge";

const gbp = (n: any) => `£${Number(n || 0).toFixed(2)}`;

export default function EditVoucherPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [voucher, setVoucher] = useState<any>(null);
    const [uses, setUses] = useState<any[]>([]);

    useEffect(() => {
        getVoucher(id).then(data => {
            if (!data) {
                toast.error("Voucher not found");
                router.push("/admin/vouchers");
                return;
            }
            setVoucher(data);
        }).catch(() => router.push("/admin/vouchers"));
        getVoucherRedemptions(id).then(setUses).catch(() => setUses([]));
    }, [id, router]);

    if (!voucher) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const counted = uses.filter(u => !u.released);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <Link href="/admin/vouchers" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4">
                    <ArrowLeft size={16} /> Back to Vouchers
                </Link>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold text-slate-900 font-mono">{voucher.code}</h1>
                    <VoucherStatusBadge status={voucher.status} />
                    {voucher.batch && <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2 py-1">Batch {voucher.batch}</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase font-bold">Used</p>
                        <p className="text-2xl font-bold text-slate-900">{voucher.usedCount} / {voucher.usageLimit || "∞"}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase font-bold">Discount given</p>
                        <p className="text-2xl font-bold text-slate-900">{gbp(voucher.totalDiscountGiven)}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase font-bold">Given back</p>
                        <p className="text-2xl font-bold text-slate-900">{uses.length - counted.length}</p>
                        <p className="text-xs text-slate-500">cancelled bookings</p>
                    </div>
                </div>
            </div>

            <VoucherForm mode="edit" initial={voucher} onSubmit={async values => {
                const result = await updateVoucher(id, values);
                if (!result.ok) return result.error;
                toast.success("Voucher saved");
                router.push("/admin/vouchers");
                return null;
            }} />

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Bookings that used this code</h2>
                    <p className="text-sm text-slate-500">A use is given back automatically if its booking is cancelled.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Booking</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Booking date</th>
                                <th className="px-6 py-3">Discount</th>
                                <th className="px-6 py-3">Used on</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {uses.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Not used yet.</td></tr>
                            ) : uses.map(u => (
                                <tr key={u.id} className={u.released ? "text-slate-400" : ""}>
                                    <td className="px-6 py-3">
                                        <Link className="font-mono font-bold text-blue-600 hover:underline"
                                            href={u.booking_type === "party" ? `/admin/party-bookings/${u.booking_id}` : `/admin/session-bookings/${u.booking_id}`}>
                                            {u.booking_number || `#${u.booking_id}`}
                                        </Link>
                                        <span className="ml-2 text-xs text-slate-500">{u.booking_type === "party" ? "Party" : "Session"}</span>
                                        {u.released && <span className="ml-2 text-xs bg-slate-100 rounded-full px-2 py-0.5">Given back</span>}
                                    </td>
                                    <td className="px-6 py-3">{u.customer_name}<div className="text-xs text-slate-500">{u.email}</div></td>
                                    <td className="px-6 py-3">{u.booking_date ? new Date(u.booking_date).toLocaleDateString("en-GB") : "—"}</td>
                                    <td className="px-6 py-3 font-bold">{gbp(u.discount_amount)}</td>
                                    <td className="px-6 py-3">{new Date(u.created_at).toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
