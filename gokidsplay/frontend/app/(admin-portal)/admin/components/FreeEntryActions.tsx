"use client";

import { updateFreeEntryStatus, deleteFreeEntry } from "@/app/actions/cms";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";

export function FreeEntryActions({ entry }: { entry: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleApprove() {
        if (!confirm("Approve this free entry request?")) return;

        setLoading(true);
        try {
            await updateFreeEntryStatus(entry.id, "APPROVED");
            toast.success("Entry approved");
            router.refresh();
        } catch (error) {
            toast.error("Failed to approve entry");
        } finally {
            setLoading(false);
        }
    }

    async function handleReject() {
        const notes = prompt("Reason for rejection (optional):");
        if (notes === null) return; // User cancelled

        setLoading(true);
        try {
            await updateFreeEntryStatus(entry.id, "REJECTED", notes || undefined);
            toast.success("Entry rejected");
            router.refresh();
        } catch (error) {
            toast.error("Failed to reject entry");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Delete this entry permanently?")) return;

        setLoading(true);
        try {
            await deleteFreeEntry(entry.id);
            toast.success("Entry deleted");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete entry");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-end gap-2">
            {entry.status === "PENDING" && (
                <>
                    <button
                        onClick={handleApprove}
                        disabled={loading}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Approve"
                    >
                        <CheckCircle size={18} />
                    </button>
                    <button
                        onClick={handleReject}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Reject"
                    >
                        <XCircle size={18} />
                    </button>
                </>
            )}
            <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                title="Delete"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}
