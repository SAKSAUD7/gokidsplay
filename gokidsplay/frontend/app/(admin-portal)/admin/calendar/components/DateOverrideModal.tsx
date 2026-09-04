import { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DateOverrideModalProps {
    date: string; // YYYY-MM-DD
    onClose: () => void;
    onRefresh: () => void;
}

export function DateOverrideModal({ date, onClose, onRefresh }: DateOverrideModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [blockId, setBlockId] = useState<number | null>(null);
    const [statusType, setStatusType] = useState('BLOCKED_DATE');
    const [reason, setReason] = useState('');
    const [blockSessions, setBlockSessions] = useState(true);
    const [blockParties, setBlockParties] = useState(true);

    const API_URL = '/api';

    useEffect(() => {
        const fetchExistingBlock = async () => {
            setLoading(true);
            try {
                // Fetch all blocks and find the one for this date
                // (In a production app, we'd add ?date= filter to the backend, but this works for now)
                const res = await fetch(`${API_URL}/booking-blocks/`);
                
                // Using API route proxy would be better, assuming direct for admin
                const blocks = await res.json();
                
                const existingBlock = Array.isArray(blocks) ? blocks.find((b: any) => 
                    date >= b.start_date && date <= b.end_date
                ) : null;

                if (existingBlock) {
                    setBlockId(existingBlock.id);
                    setStatusType(existingBlock.type || 'BLOCKED_DATE');
                    setReason(existingBlock.reason || '');
                    setBlockSessions(existingBlock.blocks_normal_bookings ?? true);
                    setBlockParties(existingBlock.blocks_party_bookings ?? true);
                }
            } catch (err) {
                console.error("Failed to load blocks:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchExistingBlock();
    }, [date, API_URL]);

    const handleSave = async () => {
        if (!reason.trim()) {
            setError("Please provide a reason for the override.");
            return;
        }

        setSaving(true);
        setError(null);

        const payload = {
            start_date: date,
            end_date: date,
            reason: reason,
            type: statusType,
            blocks_normal_bookings: blockSessions,
            blocks_party_bookings: blockParties,
            recurring: false
        };

        try {
            const url = blockId 
                ? `${API_URL}/booking-blocks/${blockId}/`
                : `${API_URL}/booking-blocks/`;
            
            const method = blockId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to save override");
            }

            onRefresh();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!blockId) return;
        
        if (!confirm("Are you sure you want to remove this override? The date will become fully open based on normal capacity.")) return;

        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/booking-blocks/${blockId}/`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error("Failed to delete override");

            onRefresh();
            onClose();
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    const displayDate = format(new Date(date), 'EEEE, MMMM do, yyyy');

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <CalendarIcon className="text-blue-600" size={24} />
                            Manage Date Override
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">{displayDate}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Override Type</label>
                                <select 
                                    value={statusType}
                                    onChange={(e) => setStatusType(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="BLOCKED_DATE">Fully Closed / Blocked</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                    <option value="PRIVATE_EVENT">Private Event</option>
                                </select>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-slate-800 text-sm mb-2">Block Booking Types</h3>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={blockSessions}
                                        onChange={(e) => setBlockSessions(e.target.checked)}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="block font-medium text-slate-700">Block Normal Sessions</span>
                                        <span className="block text-xs text-slate-500">Prevents customers from booking soft play, laser arena, etc.</span>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={blockParties}
                                        onChange={(e) => setBlockParties(e.target.checked)}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="block font-medium text-slate-700">Block Parties</span>
                                        <span className="block text-xs text-slate-500">Prevents customers from booking birthday parties.</span>
                                    </div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Reason (Internal Note)</label>
                                <input 
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Bank Holiday, Deep Cleaning..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    {blockId ? (
                        <button 
                            onClick={handleDelete}
                            disabled={saving || loading}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Trash2 size={18} />
                            Remove Override
                        </button>
                    ) : <div></div>}
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            disabled={saving}
                            className="px-5 py-2 font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                            ) : (
                                <Save size={18} />
                            )}
                            Save Override
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
