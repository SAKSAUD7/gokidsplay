"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createPageSection, updatePageSection } from "@/app/actions/page-sections";
import { Loader2, Save } from "lucide-react";
import { CMSField } from "@/components/admin/cms/CMSField";
import { BouncyButton } from "@repo/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
    title: z.string().min(1, "Title is required"),
    subtitle: z.string().min(1, "Subtitle is required"),
    image_url: z.string().url("Valid image URL is required").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface ContactHeroEditorProps {
    initialData?: any;
}

export function ContactHeroEditor({ initialData }: ContactHeroEditorProps) {
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        setValue,
        watch
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: initialData?.title || "Contact Us",
            subtitle: initialData?.subtitle || "Have questions? We'd love to hear from you.",
            image_url: initialData?.image_url || ""
        }
    });

    const onSubmit = (data: FormData) => {
        startTransition(async () => {
            try {
                let result;
                if (initialData?.id) {
                    result = await updatePageSection(initialData.id, {
                        ...initialData,
                        ...data
                    });
                } else {
                    result = await createPageSection({
                        page: "contact",
                        section_key: "hero",
                        ...data
                    });
                }

                if (result.success) {
                    toast.success("Hero section updated successfully");
                } else {
                    toast.error(result.error || "Failed to update hero section");
                }
            } catch (error) {
                toast.error("Something went wrong");
            }
        });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-8">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Hero Section</h2>
                <p className="text-sm text-slate-500">Customize the top banner title and subtitle</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <CMSField
                    label="Title"
                    error={errors.title?.message}
                >
                    <input
                        {...register("title")}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Contact Us"
                    />
                </CMSField>

                <CMSField
                    label="Subtitle"
                    error={errors.subtitle?.message}
                >
                    <textarea
                        {...register("subtitle")}
                        rows={2}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                        placeholder="Have questions?..."
                    />
                </CMSField>

                {/* 
            TODO: If you have an image upload field component, use it here.
            For now, just a URL input + generic Upload Logic if needed.
        */}
                <CMSField label="Background Image URL (Optional)" error={errors.image_url?.message}>
                    <input
                        {...register("image_url")}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="https://..."
                    />
                </CMSField>

                <div className="flex justify-end pt-4">
                    <BouncyButton
                        type="submit"
                        disabled={isPending || !isDirty}
                        aria-disabled={isPending}
                        className="px-6 py-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </BouncyButton>
                </div>
            </form>
        </div>
    );
}
