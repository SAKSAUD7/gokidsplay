'use client';

import React, { useState } from 'react';
import { createGalleryItem, deleteGalleryItem } from '@/app/actions/gallery';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media-utils';

interface GalleryManagerProps {
    items: any[];
}

export function GalleryManager({ items: initialItems }: GalleryManagerProps) {
    const [items, setItems] = useState(initialItems);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        let successCount = 0;

        try {
            // Use streaming upload proxy (formerly video-upload, now generic)
            // No need to import uploadImage

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);

                // Upload using streaming proxy
                const res = await fetch('/api/cms/video-upload', {
                    method: 'POST',
                    body: formData,
                });

                const result = await res.json();

                if (res.ok && result.success && result.url) {
                    // Create Gallery Item
                    const createRes = await createGalleryItem({
                        title: file.name.split('.')[0],
                        imageUrl: result.url,
                        category: 'General',
                        active: true,
                        order: items.length + i
                    });

                    if (createRes.success && createRes.item) {
                        setItems(prev => [...prev, createRes.item]);
                        successCount++;
                    }
                } else {
                    const errorMessage = result.error || 'Unknown error';
                    console.error('Upload failed:', errorMessage);
                    toast.error(`Upload failed: ${errorMessage}`);
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully added ${successCount} images`);
            } else if (files.length > 0 && successCount === 0) {
                // If all failed, the individual toasts above will show why
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload some images');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;

        const result = await deleteGalleryItem(id);
        if (result.success) {
            setItems(prev => prev.filter(item => item.id !== id));
            toast.success('Image deleted');
        } else {
            toast.error('Failed to delete image');
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Gallery</h2>
                    <p className="text-sm text-slate-500">Manage home page gallery images</p>
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
                        {uploading ? 'Uploading...' : 'Upload Images'}
                    </button>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                            <Image src={getMediaUrl(item.image_url)} alt={item.title || "Gallery image"} fill className="object-cover" />
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
                            No images in gallery. Upload some to get started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
