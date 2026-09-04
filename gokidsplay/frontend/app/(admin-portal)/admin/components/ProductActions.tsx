"use client";

import { deleteProduct, updateProduct } from "@/app/actions/cms";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";

export function ProductActions({ product }: { product: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleToggle() {
        setLoading(true);
        try {
            await updateProduct(product.id, { active: !product.active });
            toast.success(product.active ? "Product hidden" : "Product activated");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update product");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm(`Delete "${product.name}"?`)) return;

        setLoading(true);
        try {
            await deleteProduct(product.id);
            toast.success("Product deleted");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete product");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Link
                href={`/admin/shop/${product.id}`}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
            >
                <Edit size={16} className="inline mr-1" />
                Edit
            </Link>
            <button
                onClick={handleToggle}
                disabled={loading}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                title={product.active ? "Hide" : "Show"}
            >
                {product.active ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
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
