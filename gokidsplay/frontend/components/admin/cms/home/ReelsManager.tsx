'use client';

import React, { useState } from 'react';
import { createInstagramReel, deleteInstagramReel } from '@/app/actions/instagram-reels';
import { Loader2, Plus, Trash2, Video } from 'lucide-react';
import { toast } from 'sonner';

interface ReelsManagerProps {
    items: any[];
}

export function ReelsManager({ items: initialItems }: ReelsManagerProps) {
    const [items, setItems] = useState(initialItems);
    const [newUrl, setNewUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!newUrl.trim()) return;

        setLoading(true);
        try {
            console.log('[ReelsManager] Adding reel:', newUrl);
            const result = await createInstagramReel({
                reelUrl: newUrl,
                thumbnailUrl: '', // Let the backend fetch from Instagram oEmbed
                title: 'New Reel',
                active: true,
                order: items.length
            });

            console.log('[ReelsManager] Result:', result);

            if (result.success && result.item) {
                setItems(prev => [...prev, result.item]);
                setNewUrl('');
                toast.success('Reel added successfully!');
            } else {
                const errorMsg = result.error || 'Failed to add reel. Please check console for details.';
                console.error('[ReelsManager] Add failed:', errorMsg);
                toast.error(errorMsg);
            }
        } catch (error: any) {
            console.error('[ReelsManager] Error adding reel:', error);
            const errorMsg = error.message || error.toString() || 'An error occurred';
            toast.error(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;

        const result = await deleteInstagramReel(id);
        if (result.success) {
            setItems(prev => prev.filter(item => item.id !== id));
            toast.success('Reel deleted');
        } else {
            toast.error('Failed to delete reel');
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Instagram Reels</h2>
                <p className="text-sm text-slate-500">Manage social feed videos</p>
            </div>

            <div className="p-6 space-y-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="Paste Instagram Reel URL..."
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={loading || !newUrl.trim()}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add Reel
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                                <Video className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{item.title || 'Reel'}</p>
                                <a href={item.reelUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">
                                    {item.reelUrl}
                                </a>
                            </div>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                            No reels added yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
