"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Trash, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteInvitationTemplate, createInvitationTemplate, updateInvitationTemplate } from "@/app/actions/invitation-templates";
import ImageUploadField from "./ImageUploadField";
import { getInvitationTemplate } from "@/app/actions/invitation-templates";
import { compressImage } from "../../../lib/compress-image";
import { useToast } from "../../../../components/ToastProvider";

const templateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    background_image: z.union([z.instanceof(File), z.string()]).refine((val) => val !== null && val !== "", "Background image is required"),
    default_title: z.string().min(1, "Default Title is required"),
    default_message: z.string().min(1, "Default Message is required"),
    is_active: z.boolean(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface InvitationTemplateFormProps {
    initialId?: number;
}

interface InvitationTemplateFormProps {
    initialId?: number;
}

export function InvitationTemplateForm({ initialId }: InvitationTemplateFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(!!initialId);
    const [error, setError] = useState("");
    const { showToast } = useToast();
    const [success, setSuccess] = useState(false);

    const form = useForm<TemplateFormData>({
        resolver: zodResolver(templateSchema),
        defaultValues: {
            name: "",
            background_image: "",
            default_title: "You're Invited!",
            default_message: "Come join us for a party at Go Kids Play Leicester!",
            is_active: true,
        },
    });

    useEffect(() => {
        if (initialId) {
            loadData(initialId);
        }
    }, [initialId]);

    const loadData = async (id: number) => {
        try {
            const data = await getInvitationTemplate(id);
            if (data) {
                form.reset({
                    name: data.name,
                    background_image: data.background_image,
                    default_title: data.default_title,
                    default_message: data.default_message,
                    is_active: data.is_active
                });
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load template");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: TemplateFormData) => {
        setIsSubmitting(true);
        setError("");
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('default_title', data.default_title);
            formData.append('default_message', data.default_message);
            formData.append('is_active', data.is_active ? 'true' : 'false');

            if (data.background_image instanceof File) {
                try {
                    const compressedFile = await compressImage(data.background_image);
                    formData.append('background_image', compressedFile);
                } catch (compressionErr) {
                    console.error("Compression failed, using original", compressionErr);
                    if (data.background_image.size > 10 * 1024 * 1024) {
                        throw new Error("Image is too large and compression failed. Please upload a smaller image.");
                    }
                    formData.append('background_image', data.background_image);
                }
            }

            if (initialId) {
                await updateInvitationTemplate(initialId, formData);
                showToast("success", "Template updated successfully!");
                setSuccess(true);
            } else {
                await createInvitationTemplate(formData);
                showToast("success", "Template created successfully!");
                setSuccess(true);
            }

            setTimeout(() => {
                router.push("/admin/invitations");
                router.refresh();
            }, 1000);

        } catch (err: any) {
            console.error("Submission error:", err);
            const errorMessage = err.message || "Something went wrong";
            setError(errorMessage);
            showToast("error", errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDelete = async () => {
        if (!initialId || !confirm("Are you sure you want to delete this template?")) return;

        setIsSubmitting(true);
        try {
            await deleteInvitationTemplate(initialId);
            router.push("/admin/invitations");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to delete");
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading template...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/invitations" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">
                    {initialId ? "Edit Template" : "New Template"}
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                        <input
                            {...form.register("name")}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue/20 focus:border-neon-blue text-slate-900"
                            placeholder="e.g. Superhero Theme"
                        />
                        {form.formState.errors.name && (
                            <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <Controller
                            control={form.control}
                            name="background_image"
                            render={({ field: { value, onChange } }) => (
                                <ImageUploadField
                                    label="Background Image"
                                    value={value}
                                    onChange={onChange}
                                    error={form.formState.errors.background_image?.message as string}
                                />
                            )}
                        />
                        <p className="text-xs text-slate-500 mt-1">Recommended size: 1920x1080px or similar landscape.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Default Title</label>
                        <input
                            {...form.register("default_title")}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue/20 focus:border-neon-blue text-slate-900"
                            placeholder="You're Invited!"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Default Message</label>
                        <textarea
                            {...form.register("default_message")}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue/20 focus:border-neon-blue text-slate-900 min-h-[100px]"
                            placeholder="Come celebrate..."
                        />
                    </div>

                    <div className="flex items-center pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...form.register("is_active")}
                                className="w-4 h-4 rounded border-slate-300 text-neon-blue focus:ring-neon-blue"
                            />
                            <span className="text-sm font-medium text-slate-700">Active (Visible to customers)</span>
                        </label>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    {initialId && (
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
                        disabled={isSubmitting || success}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all text-sm font-bold disabled:opacity-50 ${success
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-neon-blue text-white hover:bg-blue-600"
                            }`}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : success ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {success
                            ? "Saved!"
                            : initialId ? "Update Template" : "Create Template"
                        }
                    </button>
                </div>
            </form>
        </div>
    );
}

export default InvitationTemplateForm;
