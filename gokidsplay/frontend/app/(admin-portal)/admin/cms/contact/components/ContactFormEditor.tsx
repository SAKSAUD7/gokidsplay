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
    subtitle: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ContactFormEditorProps {
    initialData?: any;
}

export function ContactFormEditor({ initialData }: ContactFormEditorProps) {
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: initialData?.title || "Send us a Message",
            subtitle: initialData?.subtitle || "",
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
                        section_key: "contact_form",
                        ...data
                    });
                }

                if (result.success) {
                    toast.success("Form section updated successfully");
                } else {
                    toast.error(result.error || "Failed to update form section");
                }
            } catch (error) {
                toast.error("Something went wrong");
            }
        });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Contact Form Section</h2>
                <p className="text-sm text-slate-500">Customize the form header</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <CMSField
                    label="Form Title"
                    error={errors.title?.message}
                >
                    <input
                        {...register("title")}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Send us a Message"
                    />
                </CMSField>

                <CMSField
                    label="Subtitle / Intro (Optional)"
                    error={errors.subtitle?.message}
                >
                    <textarea
                        {...register("subtitle")}
                        rows={2}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                        placeholder="Subtext above form..."
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
