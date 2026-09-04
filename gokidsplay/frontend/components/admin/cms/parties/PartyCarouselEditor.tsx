'use client';

import React, { useState } from 'react';
import { createGalleryItem, deleteGalleryItem } from '@/app/actions/gallery';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/media-utils';

interface PartyCarouselEditorProps {
    items: any[];
}

export function PartyCarouselEditor({ items: initialItems }: PartyCarouselEditorProps) {
    const [items, setItems] = useState(initialItems);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        let successCount = 0;

        try {
            // Import server action dynamically
            const { uploadImage } = await import('@/app/actions/upload-image');

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);

                // Upload using server action (same as ImageUploadField)
                const result = await uploadImage(formData);

                if (result.success && result.url) {
                    // Create Gallery Item with specific category
                    const createRes = await createGalleryItem({
                        title: file.name.split('.')[0],
                        imageUrl: result.url,
                        category: 'parties_carousel', // STRICT CATEGORY
                        active: true,
                        order: items.length + i + 1
                    });

                    if (createRes.success && createRes.item) {
                        setItems(prev => [...prev, createRes.item]);
                        successCount++;
                    }
                } else {
                    console.error('Upload failed:', result.error);
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully added ${successCount} images to carousel`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this image from carousel?')) return;

        const result = await deleteGalleryItem(id);
        if (result.success) {
            setItems(prev => prev.filter(item => item.id !== id));
            toast.success('Image removed');
        } else {
            toast.error('Failed to remove image');
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Party Carousel Images</h2>
                    <p className="text-sm text-slate-500">Manage images in the party page slider</p>
                </div>

                <div className="relative">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : 'Add Images'}
                    </button>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="group relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                            <img src={getMediaUrl(item.image_url)} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                            No images in carousel. Upload some to display.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
