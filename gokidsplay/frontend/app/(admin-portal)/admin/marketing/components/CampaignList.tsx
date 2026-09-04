"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Mail,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    MoreHorizontal,
    Send,
    Edit,
    Trash
} from "lucide-react";
import { getCampaigns, deleteCampaign, sendCampaign } from "@/app/actions/marketing";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { StatusBadge } from "@/app/(admin-portal)/admin/components/StatusBadge";

interface Campaign {
    id: number;
    title: string;
    subject: string;
    status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'FAILED';
    status_display: string;
    recipient_type_display: string;
    sent_at: string | null;
    scheduled_at: string | null;
    sent_count: number;
    failed_count: number;
    created_at: string;
}

export default function CampaignList() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCampaigns = async () => {
        try {
            const data = await getCampaigns();
            setCampaigns(data);
        } catch (error) {
            console.error("Failed to load campaigns", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this campaign?")) return;
        try {
            await deleteCampaign(id);
            loadCampaigns();
        } catch (error) {
            alert("Failed to delete campaign");
        }
    };

    const handleSend = async (id: number, title: string) => {
        if (!confirm(`Are you sure you want to SEND campaign "${title}" to all recipients?\nThis cannot be undone.`)) return;
        try {
            await sendCampaign(id);
            alert(`Campaign "${title}" queued for sending successfully.`);
            loadCampaigns();
        } catch (error: any) {
            console.error("Failed to send campaign", error);
            alert(`Failed to send campaign: ${error.message}`);
        }
    };

    if (loading) return <div className="p-4">Loading campaigns...</div>;

    if (campaigns.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No campaigns yet</h3>
                <p className="text-slate-500 mt-1">Create your first email marketing campaign to get started.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 font-semibold text-slate-700">Campaign</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Recipients</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Sent / Failed</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {campaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-medium text-slate-900">{campaign.title}</div>
                                <div className="text-slate-500 text-xs mt-0.5">{campaign.subject}</div>
                            </td>
                            <td className="px-6 py-4">
                                <StatusBadge status={campaign.status} />
                                <div className="text-xs text-slate-400 mt-1">
                                    {campaign.sent_at && format(new Date(campaign.sent_at), "MMM d, yyyy HH:mm")}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                                {campaign.recipient_type_display}
                            </td>
                            <td className="px-6 py-4">
                                {campaign.status === 'SENT' ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            {campaign.sent_count} Notified
                                        </div>
                                        {campaign.failed_count > 0 && (
                                            <div className="flex items-center text-red-600 text-xs font-medium bg-red-50 px-2 py-0.5 rounded-full">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                {campaign.failed_count} Failed
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-slate-400">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {campaign.status === 'DRAFT' && (
                                        <>
                                            <button
                                                onClick={() => handleSend(campaign.id, campaign.title)}
                                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                                title="Send Campaign Now"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                            <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                            <button
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(campaign.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                title="Delete"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
