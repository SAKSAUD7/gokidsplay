'use client';

import React, { useState } from 'react';
import { createPageSection, updatePageSection } from '@/app/actions/page-sections';
import { Loader2, Save, Upload, ImageIcon } from 'lucide-react';
import { ImageUploadField } from '@/components/admin/cms/fields/ImageUploadField';
import { toast } from 'sonner';

interface PageSectionEditorProps {
    page: string;
    sectionKey: string;
    sectionTitle: string;
    initialData?: any;
    hideImage?: boolean; // New prop
}

export function PageSectionEditor({ page, sectionKey, sectionTitle, initialData, hideImage = false }: PageSectionEditorProps) {
    const [loading, setLoading] = useState(false);
    // If no initial data, we prep state for creation
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        subtitle: initialData?.subtitle || '',
        content: initialData?.content || '',
        image_url: initialData?.image_url || '',
        cta_text: initialData?.cta_text || '',
        cta_link: initialData?.cta_link || '',
    });

    const isNew = !initialData?.id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (url: string) => {
        setFormData(prev => ({ ...prev, image_url: url }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (isNew) {
                // Create
                const res = await createPageSection({
                    page,
                    section_key: sectionKey,
                    ...formData
                });
                if (res.success) {
                    toast.success(`${sectionTitle} created successfully`);
                    // We might need to reload specific to parent, but this updates server cache
                    window.location.reload();
                } else {
                    toast.error(res.error || 'Failed to create section');
                }
            } else {
                // Update
                const res = await updatePageSection(initialData.id, formData);
                if (res.success) {
                    toast.success(`${sectionTitle} updated successfully`);
                } else {
                    toast.error(res.error || 'Failed to update section');
                }
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">{sectionTitle}</h2>
                    <p className="text-sm text-slate-500">Edit the {sectionTitle.toLowerCase()} content</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Main Heading</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="e.g., Welcome to Go Kids Play"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                    <textarea
                        name="subtitle"
                        value={formData.subtitle}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="e.g., Leicester's premier roller skating and bowling venue"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CTA Button Text (Optional)</label>
                        <input
                            type="text"
                            name="cta_text"
                            value={formData.cta_text}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="e.g., Book Now"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CTA Link (Optional)</label>
                        <input
                            type="text"
                            name="cta_link"
                            value={formData.cta_link}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="e.g., /bookings"
                        />
                    </div>
                </div>

                {!hideImage && (
                    <div>
                        <ImageUploadField
                            field={{
                                label: "Background Image",
                                name: "image_url",
                                type: "image",
                                required: false
                            }}
                            value={formData.image_url}
                            onChange={handleImageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
