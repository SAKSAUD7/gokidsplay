"use client";

import { useState, useEffect } from "react";
import { getBookingBlocks, deleteBookingBlock } from "@/app/actions/admin";
import Link from "next/link";
import { CalendarX, Trash2, Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function HolidayClosedPage() {
    const [blocks, setBlocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBlocks();
    }, []);

    async function loadBlocks() {
        try {
            const data = await getBookingBlocks();
            // Filter for CLOSED or MAINTENANCE types
            const closedBlocks = data.filter((block: any) =>
                block.type === "CLOSED" || block.type === "MAINTENANCE"
            );
            setBlocks(closedBlocks);
        } catch (error) {
            toast.error("Failed to load holiday dates");
            setBlocks([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this holiday date?")) return;

        try {
            await deleteBookingBlock(id);
            toast.success("Holiday date removed");
            loadBlocks(); // Reload list
        } catch (error) {
            toast.error("Failed to delete holiday date");
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
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Holiday Closed Dates</h1>
                    <p className="text-slate-500">Manage dates when the park is closed or under maintenance</p>
                </div>
                <Link
                    href="/admin/booking-blocks/new?type=CLOSED"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Closed Date
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
                                        <CalendarX className="w-8 h-8 text-slate-300" />
                                        <p>No closed dates found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            blocks.map((block) => (
                                <tr key={block.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">
                                            {format(new Date(block.startDate), "MMM d, yyyy")}
                                        </div>
                                        {block.startDate !== block.endDate && (
                                            <div className="text-slate-500 text-xs mt-0.5">
                                                to {format(new Date(block.endDate), "MMM d, yyyy")}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{block.reason}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${block.type === 'CLOSED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {block.type}
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
