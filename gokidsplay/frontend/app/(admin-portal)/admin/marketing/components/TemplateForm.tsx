"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import react-quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import { createTemplate, updateTemplate } from "@/app/actions/marketing";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

interface TemplateFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export default function TemplateForm({ initialData, isEditing = false }: TemplateFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        type: initialData?.type || "GENERAL",
        subject: initialData?.subject || "",
        html_content: initialData?.html_content || "",
        is_active: initialData?.is_active ?? true,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContentChange = (content: string) => {
        setFormData(prev => ({ ...prev, html_content: content }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, is_active: e.target.checked }));
    };

    // Quill modules configuration
    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
    }), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (isEditing && initialData?.id) {
                await updateTemplate(initialData.id, formData);
            } else {
                await createTemplate(formData);
            }
            router.push("/admin/marketing/templates");
            router.refresh();
        } catch (error) {
            console.error("Failed to save template", error);
            alert("Failed to save template. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Template Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Monthly Newsletter"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Type
                        </label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="GENERAL">General</option>
                            <option value="PROMOTION">Promotion</option>
                            <option value="HOLIDAY">Holiday</option>
                            <option value="BIRTHDAY">Birthday</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Subject
                        </label>
                        <input
                            type="text"
                            name="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="Subject line for emails using this template"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Content (Template Body)
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            Design your email layout here. If this is a base template, type <code>{"{{ content }}"}</code> where you want future campaign text to be injected.
                        </p>
                        <div className="bg-white">
                            <ReactQuill 
                                theme="snow"
                                value={formData.html_content}
                                onChange={handleContentChange}
                                modules={modules}
                                className="h-64 mb-12"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={handleCheckboxChange}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                            Active
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between rounded-b-lg">
                <Link
                    href="/admin/marketing/templates"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Template
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
