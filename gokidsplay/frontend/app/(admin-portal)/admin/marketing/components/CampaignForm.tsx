"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import react-quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

import { createCampaign, updateCampaign, getTemplates } from "@/app/actions/marketing";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

interface CampaignFormProps {
    initialData?: any;
    isEditing?: boolean;
}

interface EmailTemplate {
    id: number;
    name: string;
}

export default function CampaignForm({ initialData, isEditing = false }: CampaignFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);

    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        subject: initialData?.subject || "",
        template: initialData?.template || "",
        content: initialData?.content || "",
        recipient_type: initialData?.recipient_type || "ALL_ADULTS",
        custom_email_list: initialData?.custom_email_list || "",
        status: initialData?.status || "DRAFT",
    });

    useEffect(() => {
        // Fetch templates for dropdown
        const loadTemplates = async () => {
            try {
                const data = await getTemplates();
                setTemplates(data);
            } catch (error) {
                console.error("Failed to load templates", error);
            }
        };
        loadTemplates();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContentChange = (content: string) => {
        setFormData(prev => ({ ...prev, content }));
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
                await updateCampaign(initialData.id, formData);
            } else {
                await createCampaign(formData);
            }
            router.push("/admin/marketing");
            router.refresh();
        } catch (error) {
            console.error("Failed to save campaign", error);
            alert("Failed to save campaign. Please try again.");
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
                            Campaign Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Internal ID e.g., 'Summer Promo 2026'"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Subject
                        </label>
                        <input
                            type="text"
                            name="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="Subject line seen by users"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Template
                        </label>
                        <select
                            name="template"
                            required
                            value={formData.template}
                            onChange={handleChange}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a template...</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Recipient List
                        </label>
                        <select
                            name="recipient_type"
                            value={formData.recipient_type}
                            onChange={handleChange}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL_ADULTS">All Adult Participants</option>
                            <option value="ALL_GUARDIANS">All Guardians</option>
                            <option value="CUSTOM_LIST">Custom List (Manual Entry)</option>
                        </select>
                    </div>

                    {formData.recipient_type === 'CUSTOM_LIST' && (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Custom Email List
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                Enter email addresses separated by commas or new lines.
                            </p>
                            <textarea
                                name="custom_email_list"
                                rows={4}
                                value={formData.custom_email_list}
                                onChange={handleChange}
                                placeholder="alice@example.com, bob@example.com"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Injectable Content
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            This rich text will be injected into the selected template.
                        </p>
                        <div className="bg-white">
                            <ReactQuill 
                                theme="snow"
                                value={formData.content}
                                onChange={handleContentChange}
                                modules={modules}
                                className="h-64 mb-12"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between rounded-b-lg">
                <Link
                    href="/admin/marketing"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                    Cancel
                </Link>
                <div className="flex items-center gap-3">
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
                                Save Draft
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
