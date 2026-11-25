'use client';

/**
 * Website Content → Home Page → Promotions slider.
 * Images of vouchers and offers shown in a slider near the top of the homepage. The slider
 * only appears while at least one promotion is switched on and within its dates.
 */

import React, { useState } from 'react';
import { createBanner, deleteBanner, updateBanner } from '@/app/actions/banners';
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Save, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/media-utils';

interface Promotion {
    id: number;
    title: string;
    image_url: string;
    link: string | null;
    start_date: string | null;
    end_date: string | null;
    active: boolean;
    order: number;
}

const ukToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });

function showingNow(p: Promotion) {
    const today = ukToday();
    return p.active && (!p.start_date || p.start_date <= today) && (!p.end_date || p.end_date >= today);
}

const input = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none';

export function PromotionsManager({ items: initial }: { items: Promotion[] }) {
    const [items, setItems] = useState<Promotion[]>([...initial].sort((a, b) => a.order - b.order));
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState<number | null>(null);

    const patch = (id: number, change: Partial<Promotion>) =>
        setItems(prev => prev.map(p => (p.id === id ? { ...p, ...change } : p)));

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        try {
            const { uploadMediaFile } = await import('@/lib/cms/upload-client');
            let order = items.reduce((max, p) => Math.max(max, p.order), 0);
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                const uploaded = await uploadMediaFile(formData);
                if (!uploaded.success || !uploaded.url) {
                    toast.error(`${file.name}: ${uploaded.error || 'upload failed'}`);
                    continue;
                }
                order += 1;
                const created = await createBanner({
                    title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
                    imageUrl: uploaded.url, link: '/book', active: true, order,
                });
                if (created.success && created.banner) setItems(prev => [...prev, created.banner as Promotion]);
                else toast.error(created.error || 'Could not add the promotion');
            }
            toast.success('Promotion added — it is on the homepage now');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const save = async (p: Promotion, change: Partial<Promotion> = {}) => {
        const next = { ...p, ...change };
        setSaving(p.id);
        const result = await updateBanner(String(p.id), {
            title: next.title, link: next.link || null, active: next.active, order: next.order,
            startDate: next.start_date || null, endDate: next.end_date || null,
        });
        setSaving(null);
        if (result.success) {
            patch(p.id, change);
            toast.success('Saved');
        } else {
            toast.error(result.error || 'Could not save');
        }
    };

    const move = async (index: number, direction: -1 | 1) => {
        const other = items[index + direction];
        const current = items[index];
        if (!other) return;
        const swapped = [...items];
        swapped[index] = { ...other, order: current.order };
        swapped[index + direction] = { ...current, order: other.order };
        // Orders may be equal (older rows): renumber so the move always shows
        const renumbered = swapped.map((p, i) => ({ ...p, order: i + 1 }));
        setItems(renumbered);
        await Promise.all(renumbered.map(p => updateBanner(String(p.id), { order: p.order })));
    };

    const remove = async (p: Promotion) => {
        if (!confirm('Remove this promotion from the homepage?')) return;
        const result = await deleteBanner(String(p.id));
        if (result.success) {
            setItems(prev => prev.filter(x => x.id !== p.id));
            toast.success('Promotion removed');
        } else {
            toast.error('Could not remove it');
        }
    };

    const live = items.filter(showingNow).length;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Promotions slider</h2>
                    <p className="text-sm text-slate-500">
                        Images of your vouchers and offers, shown in a slider near the top of the homepage.
                        {' '}{live > 0 ? `${live} showing now.` : 'Hidden on the homepage until you add one that is switched on.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Best size: 1600 × 700 pixels (wide). Text in the image should stay away from the edges.</p>
                </div>
                <label className="relative flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium cursor-pointer">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading…' : 'Add promotion images'}
                    <input type="file" multiple accept="image/*" onChange={handleUpload} disabled={uploading} className="sr-only" />
                </label>
            </div>

            <div className="p-6 space-y-4">
                {items.length === 0 && (
                    <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                        No promotions yet. Add an image and the slider appears on the homepage.
                    </div>
                )}
                {items.map((p, index) => (
                    <div key={p.id} className={`flex flex-col md:flex-row gap-4 border rounded-xl p-4 ${showingNow(p) ? 'border-slate-200' : 'border-slate-200 bg-slate-50 opacity-80'}`}>
                        <div className="md:w-64 shrink-0">
                            <div className="aspect-[16/7] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                <img src={getMediaUrl(p.image_url)} alt={p.title} className="w-full h-full object-cover" />
                            </div>
                            <p className={`text-xs font-bold mt-2 ${showingNow(p) ? 'text-green-600' : 'text-slate-400'}`}>
                                {showingNow(p) ? '● Showing on the homepage' : !p.active ? '○ Switched off' : '○ Outside its dates'}
                            </p>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1">Describes the image</label>
                                <input className={input} value={p.title} maxLength={255}
                                    onChange={e => patch(p.id, { title: e.target.value })} placeholder="e.g. Buy 2 Get 1 Free this half-term" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1">Link when clicked (optional)</label>
                                <input className={input} value={p.link || ''} maxLength={500}
                                    onChange={e => patch(p.id, { link: e.target.value })} placeholder="/book" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Show from (optional)</label>
                                <input type="date" className={input} value={p.start_date || ''}
                                    onChange={e => patch(p.id, { start_date: e.target.value || null })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Show until (optional)</label>
                                <input type="date" className={input} value={p.end_date || ''}
                                    onChange={e => patch(p.id, { end_date: e.target.value || null })} />
                            </div>
                            <div className="sm:col-span-2 flex flex-wrap items-center gap-2 pt-1">
                                <button onClick={() => save(p)} disabled={saving === p.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                                    {saving === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                                </button>
                                <button onClick={() => save(p, { active: !p.active })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50">
                                    {p.active ? <><EyeOff className="w-4 h-4" /> Switch off</> : <><Eye className="w-4 h-4" /> Switch on</>}
                                </button>
                                <button onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move earlier"
                                    className="p-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                                <button onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Move later"
                                    className="p-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                                <button onClick={() => remove(p)} aria-label="Remove promotion"
                                    className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
