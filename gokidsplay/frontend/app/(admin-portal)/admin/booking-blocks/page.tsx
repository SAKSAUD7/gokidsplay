"use client";

import { useState, useEffect } from "react";
import { getBookingBlocks, deleteBookingBlock } from "@/app/actions/admin";
import Link from "next/link";
import { Calendar, Trash2, Plus, AlertCircle, Edit } from "lucide-react";
import { format } from "date-fns";

export default function BookingBlocksPage() {
    const [blocks, setBlocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBlocks();
    }, []);

    async function loadBlocks() {
        try {
            const data = await getBookingBlocks();
            setBlocks(data);
        } catch (error) {
            // Error handled silently - could add toast notification here
            setBlocks([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this block?")) return;

        try {
            await deleteBookingBlock(id);
            loadBlocks(); // Reload list
        } catch (error) {
            alert("Failed to delete block. Please try again.");
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Booking Blocks</h1>
                    <p className="text-slate-500">Manage blocked dates and times</p>
                </div>
                <Link
                    href="/admin/booking-blocks/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add New Block
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Date Range</th>
                            <th className="px-6 py-3">Reason</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Recurring</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {blocks.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Calendar className="w-8 h-8 text-slate-300" />
                                        <p>No booking blocks found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            blocks.map((block) => (
                                <tr key={block.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">
                                            {format(new Date(block.startDate), "MMM d, yyyy h:mm a")}
                                        </div>
                                        <div className="text-slate-500 text-xs mt-0.5">
                                            to {format(new Date(block.endDate), "MMM d, yyyy h:mm a")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{block.reason}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${block.type === 'CLOSED' ? 'bg-red-100 text-red-700' :
                                                block.type === 'CLOSED_TODAY' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                    block.type === 'OPEN_TODAY' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                        block.type === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-blue-100 text-blue-700'
                                            }`}>
                                            {block.type === 'CLOSED_TODAY' ? 'HOLIDAY CLOSED' :
                                                block.type === 'OPEN_TODAY' ? 'HOLIDAY OPEN' :
                                                    block.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {block.recurring ? "Yes" : "No"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/booking-blocks/${block.id}`}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Block"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(block.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Block"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
