"use client";

import { AdminHeader } from "../../components/AdminHeader";
import CampaignForm from "../components/CampaignForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewCampaignPage() {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <AdminHeader
                title="Create New Campaign"
                description="Draft and schedule a new marketing campaign"
                actions={
                    <Link
                        href="/admin/marketing"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Campaigns
                    </Link>
                }
            />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CampaignForm />
            </main>
        </div>
    );
}
