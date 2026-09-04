"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "../../../components/AdminHeader";
import TemplateForm from "../../components/TemplateForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTemplate } from "@/app/actions/marketing";
import { useParams } from "next/navigation";

export default function EditTemplatePage() {
    const params = useParams();
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTemplate = async () => {
            if (!params.id) return;
            try {
                const data = await getTemplate(Number(params.id));
                setTemplate(data);
            } catch (error) {
                console.error("Failed to load template", error);
            } finally {
                setLoading(false);
            }
        };
        loadTemplate();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-slate-500">Loading template...</div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-red-500">Template not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <AdminHeader
                title="Edit Email Template"
                description={`Editing: ${template.name}`}
                actions={
                    <Link
                        href="/admin/marketing/templates"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to List
                    </Link>
                }
            />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <TemplateForm initialData={template} isEditing={true} />
            </main>
        </div>
    );
}
