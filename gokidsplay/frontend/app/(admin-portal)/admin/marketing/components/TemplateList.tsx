"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
    FileText,
    Edit,
    Trash,
    Check,
    X
} from "lucide-react";
import { getTemplates, deleteTemplate } from "@/app/actions/marketing";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

interface EmailTemplate {
    id: number;
    name: string;
    type: 'BIRTHDAY' | 'PROMOTION' | 'HOLIDAY' | 'GENERAL';
    type_display: string;
    subject: string;
    is_active: boolean;
    updated_at: string;
}

export default function TemplateList() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTemplates = async () => {
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error("Failed to load templates", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            await deleteTemplate(id);
            loadTemplates();
        } catch (error) {
            alert("Failed to delete template");
        }
    };

    if (loading) return <div className="p-4">Loading templates...</div>;

    if (templates.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No templates yet</h3>
                <p className="text-slate-500 mt-1">Create email templates to reuse in your campaigns.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Subject</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Last Updated</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {templates.map((template) => (
                        <tr key={template.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">
                                {template.name}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                                {template.type_display}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                                {template.subject}
                            </td>
                            <td className="px-6 py-4">
                                {template.is_active ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                                        <Check className="w-3 h-3 mr-1" /> Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                        <X className="w-3 h-3 mr-1" /> Inactive
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                                {format(new Date(template.updated_at), "MMM d, yyyy")}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Link
                                        href={`/admin/marketing/templates/${template.id}`}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        title="Delete"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
