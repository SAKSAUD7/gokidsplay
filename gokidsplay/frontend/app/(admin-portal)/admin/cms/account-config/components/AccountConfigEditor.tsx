"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, User } from 'lucide-react';
import { toast } from 'sonner';

import { cmsGet, cmsPatch } from '@/lib/cms-api';

const configSchema = z.object({
    header_title: z.string().min(1, "Header title is required"),
    cta_title: z.string().min(1, "CTA title is required"),
    cta_subtitle: z.string().min(1, "CTA subtitle is required"),
    cta_link: z.string().min(1, "CTA link is required"),
    empty_state_title: z.string().min(1, "Empty state title is required"),
    empty_state_subtitle: z.string().min(1, "Empty state subtitle is required"),
    empty_state_button_text: z.string().min(1, "Empty state button text is required"),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function AccountConfigEditor() {
    const [loading, setLoading] = useState(true);
    const [configData, setConfigData] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await cmsGet('/cms/customer-account-config/1/');
            setConfigData(data);
        } catch (error) {
            console.error('Failed to load account config', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: ConfigFormData) => {
        setSaving(true);
        try {
            await cmsPatch('/cms/customer-account-config/1/', data);
            await loadConfig();
            toast.success('Account page configuration updated successfully');
        } catch (error) {
            console.error('Failed to save account config', error);
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !configData) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <ConfigForm initialData={configData} isSaving={saving} onSave={handleSave} />
        </div>
    );
}

function ConfigForm({ initialData, isSaving, onSave }: { initialData: any, isSaving: boolean, onSave: (data: ConfigFormData) => void }) {
    const { register, handleSubmit, formState: { errors } } = useForm<ConfigFormData>({
        resolver: zodResolver(configSchema),
        defaultValues: {
            header_title: initialData?.header_title || "Hi, {name}! 👋",
            cta_title: initialData?.cta_title || "Book Another Session",
            cta_subtitle: initialData?.cta_subtitle || "Skating, bowling — book your next visit",
            cta_link: initialData?.cta_link || "/book",
            empty_state_title: initialData?.empty_state_title || "No bookings yet",
            empty_state_subtitle: initialData?.empty_state_subtitle || "Book your first session at Go Kids Play!",
            empty_state_button_text: initialData?.empty_state_button_text || "Book Now",
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Customer Account Config
                </h3>
            </div>

            <div className="p-6 space-y-8">
                {/* Header Section */}
                <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-slate-800 mb-4">Header Section</h4>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Header Title</label>
                        <p className="text-xs text-slate-400 mb-2">Use {'{name}'} to insert the customer's first name.</p>
                        <input
                            {...register('header_title')}
                            className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="e.g. Hi, {name}! 👋"
                        />
                        {errors.header_title && <p className="text-red-500 text-xs mt-1">{errors.header_title.message}</p>}
                    </div>
                </div>

                {/* Call To Action (Book Again) */}
                <div className="border-l-4 border-pink-500 pl-4">
                    <h4 className="font-semibold text-slate-800 mb-4">Book Again Call-to-Action</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CTA Title</label>
                            <input
                                {...register('cta_title')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.cta_title && <p className="text-red-500 text-xs mt-1">{errors.cta_title.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CTA Subtitle</label>
                            <input
                                {...register('cta_subtitle')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.cta_subtitle && <p className="text-red-500 text-xs mt-1">{errors.cta_subtitle.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CTA Link</label>
                            <input
                                {...register('cta_link')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.cta_link && <p className="text-red-500 text-xs mt-1">{errors.cta_link.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                <div className="border-l-4 border-amber-500 pl-4">
                    <h4 className="font-semibold text-slate-800 mb-4">Empty State (No Bookings)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                {...register('empty_state_title')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.empty_state_title && <p className="text-red-500 text-xs mt-1">{errors.empty_state_title.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                            <input
                                {...register('empty_state_subtitle')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.empty_state_subtitle && <p className="text-red-500 text-xs mt-1">{errors.empty_state_subtitle.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
                            <input
                                {...register('empty_state_button_text')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {errors.empty_state_button_text && <p className="text-red-500 text-xs mt-1">{errors.empty_state_button_text.message}</p>}
                        </div>
                    </div>
                </div>

            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium disabled:opacity-50 shadow-sm"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Configuration
                </button>
            </div>
        </form>
    );
}
