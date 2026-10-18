"use client";

import { createVoucher } from "@/app/actions/vouchers";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { VoucherForm } from "../VoucherForm";

export default function NewVoucherPage() {
    const router = useRouter();

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/vouchers" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4">
                    <ArrowLeft size={16} /> Back to Vouchers
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Create Voucher</h1>
                <p className="text-slate-500 mt-1">A discount code customers enter in the session or party booking wizard</p>
            </div>
            <VoucherForm mode="create" onSubmit={async values => {
                const result = await createVoucher(values);
                if (!result.ok) return result.error;
                toast.success("Voucher created");
                router.push("/admin/vouchers");
                return null;
            }} />
        </div>
    );
}
