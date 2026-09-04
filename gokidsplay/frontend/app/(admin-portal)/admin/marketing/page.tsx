"use client";

import { AdminHeader } from "../components/AdminHeader";
import CampaignList from "./components/CampaignList";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function MarketingPage() {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <AdminHeader
                title="Email Marketing"
                description="Manage campaigns and newsletters"
                actions={
                    <div className="flex gap-3">
                        <Link
                            href="/admin/marketing/templates"
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Manage Templates
                        </Link>
                        <Link
                            href="/admin/marketing/new"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
                        >
                            <Plus className="w-4 h-4" />
                            Create Campaign
                        </Link>
                    </div>
                }
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CampaignList />
            </main>
        </div>
    );
}
