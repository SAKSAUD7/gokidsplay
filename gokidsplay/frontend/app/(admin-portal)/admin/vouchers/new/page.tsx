"use client";

import { createVoucher } from "@/app/actions/vouchers";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewVoucherPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(formRef.current!);
        setLoading(true);
        try {
            const data = {
                code: formData.get("code") as string,
                discountType: formData.get("discountType") as string,
                discountValue: parseFloat(formData.get("discountValue") as string),
                minOrderAmount: formData.get("minOrderAmount") ? parseFloat(formData.get("minOrderAmount") as string) : undefined,
                usageLimit: formData.get("usageLimit") ? parseInt(formData.get("usageLimit") as string) : undefined,
                minHoursBeforeSlot: formData.get("minHoursBeforeSlot") ? parseInt(formData.get("minHoursBeforeSlot") as string) : 0,
                description: formData.get("description") as string,
            };

            await createVoucher(data);
            toast.success("Voucher created successfully");
            router.push("/admin/vouchers");
        } catch (error) {
            toast.error("Failed to create voucher");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/vouchers" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft size={16} />
                    Back to Vouchers
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Create New Voucher</h1>
                <p className="text-slate-500 mt-1">Add a new discount code for your customers</p>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Voucher Code</label>
                        <input
                            name="code"
                            type="text"
                            required
                            placeholder="e.g. SUMMER2024"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none uppercase text-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Discount Type</label>
                        <select
                            name="discountType"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none text-slate-900"
                        >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FLAT">Flat Amount (£)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Discount Value</label>
                        <input
                            name="discountValue"
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            placeholder="e.g. 20"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none text-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Min Order Amount (Optional)</label>
                        <input
                            name="minOrderAmount"
                            type="number"
                            min="0"
                            placeholder="e.g. 1000"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none text-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Usage Limit (Optional)</label>
                        <input
                            name="usageLimit"
                            type="number"
                            min="1"
                            placeholder="e.g. 100"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none text-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Min Hours Before Booking (Optional)</label>
                        <input
                            name="minHoursBeforeSlot"
                            type="number"
                            min="0"
                            placeholder="e.g. 3"
                            defaultValue="0"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none text-slate-900"
                        />
                        <p className="text-xs text-slate-500 mt-1">Set to 0 to disable time restriction</p>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Description (Optional)</label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Internal note about this voucher..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none resize-none text-slate-900"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-neon-blue hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Create Voucher
                    </button>
                </div>
            </form>
        </div>
    );
}
