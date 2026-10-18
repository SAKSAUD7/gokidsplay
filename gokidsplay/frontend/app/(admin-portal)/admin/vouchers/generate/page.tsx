"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { generateVouchers } from "@/app/actions/vouchers";
import { VoucherForm } from "../VoucherForm";

/** Admin → Vouchers → Generate codes: a batch of single-use codes, e.g. for gift cards or a flyer. */
export default function GenerateVouchersPage() {
    const [made, setMade] = useState<{ batch: string; codes: string[] } | null>(null);

    const download = () => {
        if (!made) return;
        const blob = new Blob([["code", ...made.codes].join("\n") + "\n"], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `vouchers-${made.batch}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/vouchers" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4">
                    <ArrowLeft size={16} /> Back to Vouchers
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Generate Codes</h1>
                <p className="text-slate-500 mt-1">Make many single-use codes at once (gift cards, flyers, competitions). Each code works for one booking.</p>
            </div>

            {made ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <p className="text-slate-700"><strong>{made.codes.length} codes</strong> made in batch <span className="font-mono">{made.batch}</span>.
                        Download them now; they also appear in the voucher list (search for the batch name).</p>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={download} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                            <Download size={18} /> Download CSV
                        </button>
                        <button onClick={() => navigator.clipboard.writeText(made.codes.join("\n")).then(() => toast.success("Codes copied"))}
                            className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50">
                            <Copy size={18} /> Copy all
                        </button>
                        <button onClick={() => setMade(null)} className="text-slate-500 px-4 py-2 hover:text-slate-700">Make another batch</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto font-mono text-sm">
                        {made.codes.map(code => <span key={code} className="bg-slate-50 border border-slate-200 rounded px-2 py-1">{code}</span>)}
                    </div>
                </div>
            ) : (
                <VoucherForm mode="generate" onSubmit={async values => {
                    const result = await generateVouchers({ ...values, prefix: values.prefix || "GKP", count: values.count || 0 });
                    if (!result.ok) return result.error;
                    setMade({ batch: result.batch, codes: result.codes });
                    toast.success(`${result.count} codes generated`);
                    return null;
                }} />
            )}
        </div>
    );
}
