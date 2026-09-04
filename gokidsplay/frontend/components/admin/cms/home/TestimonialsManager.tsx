'use client';

import React, { useState } from 'react';
import { createTestimonial, deleteTestimonial, updateTestimonial } from '@/app/actions/testimonials';
import { Loader2, Plus, Trash2, Star, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { CMSField } from '@/components/admin/cms/CMSField';
import { getMediaUrl } from '@/lib/media-utils';

interface TestimonialsManagerProps {
    items: any[];
}

export function TestimonialsManager({ items: initialItems }: TestimonialsManagerProps) {
    const [items, setItems] = useState(initialItems);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleAddNew = () => {
        setCurrentItem({
            name: '',
            role: '',
            content: '',
            rating: 5,
            image_url: '',
            type: 'TEXT',
            active: true
        });
        setIsEditing(true);
    };

    const handleEdit = (item: any) => {
        setCurrentItem({ ...item });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!currentItem.name || !currentItem.content) {
            toast.error('Name and content are required');
            return;
        }

        setLoading(true);
        try {
            let result;
            if (currentItem.id) {
                result = await updateTestimonial(currentItem.id, currentItem);
            } else {
                result = await createTestimonial(currentItem);
            }

            if (result.success && result.item) {
                if (currentItem.id) {
                    setItems(prev => prev.map(i => i.id === currentItem.id ? result.item : i));
                    toast.success('Testimonial updated');
                } else {
                    setItems(prev => [...prev, result.item]);
                    toast.success('Testimonial created');
                }
                setIsEditing(false);
                setCurrentItem(null);
            } else {
                toast.error('Failed to save testimonial');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;

        const result = await deleteTestimonial(id);
        if (result.success) {
            setItems(prev => prev.filter(item => item.id !== id));
            toast.success('Testimonial deleted');
        } else {
            toast.error('Failed to delete testimonial');
        }
    };

    const handleChange = (name: string, value: any) => {
        setCurrentItem((prev: any) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Testimonials</h2>
                    <p className="text-sm text-slate-500">Manage customer reviews</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Testimonial
                </button>
            </div>

            {isEditing && (
                <div className="p-6 bg-slate-50 border-b border-slate-100 space-y-4">
                    <h3 className="font-medium text-slate-900">{currentItem.id ? 'Edit Testimonial' : 'New Testimonial'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CMSField
                            field={{ name: 'name', label: 'Name', type: 'text', required: true }}
                            value={currentItem.name}
                            onChange={(v: any) => handleChange('name', v)}
                        />
                        <CMSField
                            field={{ name: 'role', label: 'Role (Optional)', type: 'text' }}
                            value={currentItem.role}
                            onChange={(v: any) => handleChange('role', v)}
                        />
                        <div className="col-span-full">
                            <CMSField
                                field={{ name: 'content', label: 'Review', type: 'textarea', required: true }}
                                value={currentItem.content}
                                onChange={(v: any) => handleChange('content', v)}
                            />
                        </div>
                        <CMSField
                            field={{ name: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5 }}
                            value={currentItem.rating}
                            onChange={(v: any) => handleChange('rating', v)}
                        />
                        <CMSField
                            field={{ name: 'image_url', label: 'Customer Photo', type: 'image' }}
                            value={currentItem.image_url}
                            onChange={(v: any) => handleChange('image_url', v)}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save
                        </button>
                    </div>
                </div>
            )}

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm relative group">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {item.image_url ? (
                                        <img src={getMediaUrl(item.image_url)} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                                            {item.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-medium text-slate-900">{item.name}</h4>
                                        <p className="text-xs text-slate-500">{item.role}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex text-yellow-400 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < item.rating ? 'fill-current' : 'text-slate-200'}`} />
                                ))}
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-3">{item.content}</p>
                        </div>
                    ))}

                    {items.length === 0 && !isEditing && (
                        <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                            No testimonials added yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
