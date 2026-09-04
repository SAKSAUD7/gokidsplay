"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Trash, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createGalleryItem, updateGalleryItem, deleteGalleryItem } from "@/app/actions/gallery";

const galleryItemSchema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    imageUrl: z.string().min(1, "Image URL is required"),
    active: z.boolean(),
    order: z.number(),
});

type GalleryItemFormData = z.infer<typeof galleryItemSchema>;

interface GalleryItemFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function GalleryItemForm({ initialData, isEditing = false }: GalleryItemFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const form = useForm<GalleryItemFormData>({
        resolver: zodResolver(galleryItemSchema),
        defaultValues: initialData || {
            title: "",
            category: "General",
            imageUrl: "",
            active: true,
            order: 0,
        },
    });

    const onSubmit = async (data: GalleryItemFormData) => {
        setIsSubmitting(true);
        setError("");

        try {
            if (isEditing && initialData?.id) {
                await updateGalleryItem(initialData.id, data);
            } else {
                await createGalleryItem(data);
            }
            router.push("/admin/misc-content");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDelete = async () => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        setIsSubmitting(true);
        try {
            await deleteGalleryItem(initialData.id);
            router.push("/admin/misc-content");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to delete");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/misc-content" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">
                    {isEditing ? "Edit Gallery Item" : "New Gallery Item"}
                </h1>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input
                            {...form.register("title")}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                            placeholder="Kids Jumping"
                        />
                        {form.formState.errors.title && (
                            <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select
                            {...form.register("category")}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                        >
                            <option value="General">General</option>
                            <option value="Attractions">Attractions</option>
                            <option value="Parties">Parties</option>
                            <option value="Events">Events</option>
                        </select>
                        {form.formState.errors.category && (
                            <p className="text-xs text-red-500 mt-1">{form.formState.errors.category.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                        <input
                            {...form.register("imageUrl")}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                            placeholder="https://..."
                        />
                        {form.formState.errors.imageUrl && (
                            <p className="text-xs text-red-500 mt-1">{form.formState.errors.imageUrl.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
                            <input
                                type="number"
                                {...form.register("order", { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                            />
                        </div>

                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...form.register("active")}
                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-slate-700">Active</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    {isEditing && (
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Trash className="w-4 h-4" />
                            Delete
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {isEditing ? "Update Item" : "Create Item"}
                    </button>
                </div>
            </form>
        </div>
    );
}
