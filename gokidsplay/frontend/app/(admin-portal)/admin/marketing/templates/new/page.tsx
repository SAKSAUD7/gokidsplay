"use client";

import { AdminHeader } from "../../../components/AdminHeader";
import TemplateForm from "../../components/TemplateForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewTemplatePage() {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <AdminHeader
                title="Create Email Template"
                description="Design a new email template"
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
                <TemplateForm />
            </main>
        </div>
    );
}
