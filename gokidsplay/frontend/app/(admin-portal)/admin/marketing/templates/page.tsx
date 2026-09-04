"use client";

import { AdminHeader } from "../../components/AdminHeader";
import TemplateList from "../components/TemplateList";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";

export default function TemplatesPage() {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <AdminHeader
                title="Email Templates"
                description="Manage reusable email designs"
                actions={
                    <div className="flex gap-3">
                        <Link
                            href="/admin/marketing"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Campaigns
                        </Link>
                        <Link
                            href="/admin/marketing/templates/new"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
                        >
                            <Plus className="w-4 h-4" />
                            Create Template
                        </Link>
                    </div>
                }
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <TemplateList />
            </main>
        </div>
    );
}
