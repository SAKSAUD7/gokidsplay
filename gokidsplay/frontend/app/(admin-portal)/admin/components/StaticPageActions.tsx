"use client";

import { deleteStaticPage } from "@/app/actions/cms";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";

export function StaticPageActions({ page }: { page: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        if (!confirm(`Delete "${page.title}"? This action cannot be undone.`)) return;

        setLoading(true);
        try {
            await deleteStaticPage(page.id);
            toast.success("Page deleted");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete page");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-end gap-2">
            <Link
                href={`/admin/static-pages/${page.id}`}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
            >
                <Edit size={18} />
            </Link>
            <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}
