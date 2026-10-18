"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteVoucher, setVoucherActive } from "@/app/actions/vouchers";

export function VoucherRowActions({ id, code, isActive }: { id: string; code: string; isActive: boolean }) {
    const router = useRouter();
    const [busy, start] = useTransition();

    const run = (work: () => Promise<{ ok: boolean; error?: string }>, done: string) => start(async () => {
        const result = await work();
        if (result.ok) { toast.success(done); router.refresh(); }
        else toast.error(result.error || "Something went wrong");
    });

    return (
        <div className="flex justify-end gap-1">
            <Link href={`/admin/vouchers/${id}`} title="Edit and see uses" className="p-2 text-slate-400 hover:text-blue-600">
                <Edit size={18} />
            </Link>
            <button type="button" disabled={busy} title={isActive ? "Switch off" : "Switch on"}
                onClick={() => run(() => setVoucherActive(id, !isActive), isActive ? `${code} switched off` : `${code} switched on`)}
                className={`p-2 hover:text-amber-600 disabled:opacity-50 ${isActive ? "text-emerald-500" : "text-slate-400"}`}>
                <Power size={18} />
            </button>
            <button type="button" disabled={busy} title="Delete"
                onClick={() => { if (confirm(`Delete voucher ${code}? This can't be undone.`)) run(() => deleteVoucher(id), `${code} deleted`); }}
                className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-50">
                <Trash2 size={18} />
            </button>
        </div>
    );
}
