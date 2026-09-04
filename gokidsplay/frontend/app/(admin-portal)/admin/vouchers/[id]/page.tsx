"use client";

import { useState, useRef, useEffect } from "react";
import { getVoucher, updateVoucher } from "@/app/actions/vouchers";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Ticket, Percent, DollarSign, Calendar, Hash } from "lucide-react";
import Link from "next/link";

export default function EditVoucherPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false);
    const [voucher, setVoucher] = useState<any>(null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        loadVoucher();
    }, []);

    async function loadVoucher() {
        try {
            const data = await getVoucher(params.id as string);
            setVoucher(data);
        } catch (error) {
            toast.error("Failed to load voucher");
            router.push("/admin/vouchers");
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(formRef.current!);
        setLoading(true);
        try {
            const data: any = {
                code: formData.get("code") as string,
                discountType: formData.get("discountType") as string,
                discountValue: Number(formData.get("discountValue")),
                minOrderAmount: Number(formData.get("minOrderAmount")) || undefined,
                usageLimit: Number(formData.get("usageLimit")) || undefined,
                description: formData.get("description") as string || undefined,
                isActive: formData.get("isActive") === "true"
            };

            const expiryDate = formData.get("expiryDate") as string;
            if (expiryDate) {
                data.expiryDate = new Date(expiryDate);
            }

            await updateVoucher(params.id as string, data);
            toast.success("Voucher updated successfully");
            router.push("/admin/vouchers");
        } catch (error: any) {
            toast.error(error.message || "Failed to update voucher");
        } finally {
            setLoading(false);
        }
    }

    if (!voucher) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/vouchers" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft size={16} />
                    Back to Vouchers
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Edit Voucher</h1>
                <p className="text-slate-500 mt-1">Update voucher details and settings</p>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                {/* Code */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <Ticket size={16} className="inline mr-1" />
                        Voucher Code
                    </label>
                    <input
                        name="code"
                        type="text"
                        required
                        defaultValue={voucher.code}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none uppercase text-slate-900"
                        placeholder="DISCOUNT20"
                    />
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Discount Type</label>
                        <select
                            name="discountType"
                            required
                            defaultValue={voucher.discountType}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                        >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FLAT">Flat Amount (£)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            {voucher.discountType === "PERCENTAGE" ? <Percent size={16} className="inline mr-1" /> : <DollarSign size={16} className="inline mr-1" />}
                            Discount Value
                        </label>
                        <input
                            name="discountValue"
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            defaultValue={voucher.discountValue}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                        />
                    </div>
                </div>

                {/* Min Order & Usage Limit */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            <DollarSign size={16} className="inline mr-1" />
                            Min Order Amount (£)
                        </label>
                        <input
                            name="minOrderAmount"
                            type="number"
                            min="0"
                            defaultValue={voucher.minOrderAmount || ""}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                            placeholder="Optional"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            <Hash size={16} className="inline mr-1" />
                            Usage Limit
                        </label>
                        <input
                            name="usageLimit"
                            type="number"
                            min="0"
                            defaultValue={voucher.usageLimit || ""}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                            placeholder="Unlimited"
                        />
                    </div>
                </div>

                {/* Expiry Date */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <Calendar size={16} className="inline mr-1" />
                        Expiry Date
                    </label>
                    <input
                        name="expiryDate"
                        type="date"
                        defaultValue={voucher.expiryDate ? new Date(voucher.expiryDate).toISOString().split('T')[0] : ""}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                    <textarea
                        name="description"
                        rows={3}
                        defaultValue={voucher.description || ""}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
                        placeholder="Internal notes about this voucher"
                    ></textarea>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        name="isActive"
                        value="true"
                        defaultChecked={voucher.isActive}
                        className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                    />
                    <label className="text-sm font-medium text-slate-700">
                        Active (voucher can be used)
                    </label>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <Link
                        href="/admin/vouchers"
                        className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Update Voucher
                    </button>
                </div>
            </form>
        </div>
    );
}
