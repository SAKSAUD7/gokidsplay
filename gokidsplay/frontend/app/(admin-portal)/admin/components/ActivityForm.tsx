"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Trash, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createActivity, updateActivity, deleteActivity } from "@/app/actions/activities";

const activitySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    imageUrl: z.string().min(1, "Image URL is required"),
    active: z.boolean(),
    order: z.number(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function ActivityForm({ initialData, isEditing = false }: ActivityFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const form = useForm<ActivityFormData>({
        resolver: zodResolver(activitySchema),
        defaultValues: initialData || {
            name: "",
            description: "",
            imageUrl: "",
            active: true,
            order: 0,
        },
    });

    const onSubmit = async (data: ActivityFormData) => {
        setIsSubmitting(true);
        setError("");

        try {
            if (isEditing && initialData?.id) {
                await updateActivity(initialData.id, data);
            } else {
                await createActivity(data);
            }
            router.push("/admin/activities");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDelete = async () => {
        if (!confirm("Are you sure you want to delete this activity?")) return;

        setIsSubmitting(true);
        try {
            await deleteActivity(initialData.id);
            router.push("/admin/activities");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to delete");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/activities" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">
                    {isEditing ? "Edit Activity" : "New Activity"}
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input
                            {...form.register("name")}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                            placeholder="Go Kids Play Course"
                        />
                        {form.formState.errors.name && (
                            <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            {...form.register("description")}
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                            placeholder="A challenging obstacle course..."
                        />
                        {form.formState.errors.description && (
                            <p className="text-xs text-red-500 mt-1">{form.formState.errors.description.message}</p>
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
                        {isEditing ? "Update Activity" : "Create Activity"}
                    </button>
                </div>
            </form>
        </div>
    );
}
