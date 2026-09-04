"use client";

import { useState, useRef, useEffect } from "react";
import { updateBookingBlock, getBookingBlocks } from "../../../../actions/admin";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, AlertTriangle } from "lucide-react";

export default function EditBookingBlockPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const formRef = useRef<HTMLFormElement>(null);
    const [block, setBlock] = useState<any>(null);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        async function loadBlock() {
            try {
                const blocks = await getBookingBlocks();
                const found = blocks.find((b: any) => b.id === params.id);
                if (found) {
                    setBlock(found);
                } else {
                    setError("Booking block not found");
                }
            } catch (err) {
                setError("Failed to load booking block");
            } finally {
                setFetching(false);
            }
        }
        loadBlock();
    }, [params.id]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(formRef.current!);
        setLoading(true);
        setError("");

        try {
            const startDate = new Date(`${formData.get("startDate")}T${formData.get("startTime")}`);
            const endDate = new Date(`${formData.get("endDate")}T${formData.get("endTime")}`);

            if (endDate <= startDate) {
                setError("End date/time must be after start date/time");
                setLoading(false);
                return;
            }

            const data = {
                startDate,
                endDate,
                reason: formData.get("reason") as string,
                type: formData.get("type") as string,
                recurring: formData.get("recurring") === "on",
            };

            await updateBookingBlock(params.id, data);
            router.push("/admin/booking-blocks");
            router.refresh();
        } catch (err) {
            setError("Failed to update booking block");
        } finally {
            setLoading(false);
        }
    }

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!block) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                    {error || "Booking block not found"}
                </div>
            </div>
        );
    }

    // Format dates for input fields
    const startDate = new Date(block.startDate);
    const endDate = new Date(block.endDate);
    const startDateStr = startDate.toISOString().split('T')[0];
    const startTimeStr = startDate.toTimeString().slice(0, 5);
    const endDateStr = endDate.toISOString().split('T')[0];
    const endTimeStr = endDate.toTimeString().slice(0, 5);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/booking-blocks"
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Edit Booking Block</h1>
                    <p className="text-slate-500">Update blocked dates or times</p>
                </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Start Date/Time */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                        <input
                            name="startDate"
                            type="date"
                            required
                            defaultValue={startDateStr}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                        <input
                            name="startTime"
                            type="time"
                            required
                            defaultValue={startTimeStr}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900"
                        />
                    </div>

                    {/* End Date/Time */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                        <input
                            name="endDate"
                            type="date"
                            required
                            defaultValue={endDateStr}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                        <input
                            name="endTime"
                            type="time"
                            required
                            defaultValue={endTimeStr}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900"
                        />
                    </div>
                </div>

                {/* Details */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                    <input
                        name="reason"
                        type="text"
                        required
                        defaultValue={block.reason}
                        placeholder="e.g., Maintenance, Private Event"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder:text-slate-400"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select
                            name="type"
                            required
                            defaultValue={block.type}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-slate-900"
                        >
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="PRIVATE_EVENT">Private Event</option>
                            <option value="CLOSED">Closed (Block All)</option>
                            <option value="CLOSED_TODAY">Closed Today Alert (Banner)</option>
                            <option value="OPEN_TODAY">Open Today Alert (Banner)</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                name="recurring"
                                type="checkbox"
                                defaultChecked={block.recurring}
                                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-slate-700">Recurring (Weekly)</span>
                        </label>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                    <Link
                        href="/admin/booking-blocks"
                        className="px-6 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Update Block"}
                    </button>
                </div>
            </form>
        </div>
    );
}
