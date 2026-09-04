
"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast'; // Using react-hot-toast as per project standard, Party uses sonner but let's stick to what we used before or check if sonner is available. Project uses react-hot-toast.
import {
    getPricingCarouselImages,
    deletePricingCarouselImage,
    createPricingCarouselImage
} from "@/app/actions/cms";

// Helper to get media URL if needed, or just use string
const getMediaUrl = (url: string) => url;

export default function PricingCarouselManager() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            const data = await getPricingCarouselImages();
            // Data might be snake_case image_url or image from serializer. 
            // My previous fix used 'image_url' for create, let's assume get returns 'image' or 'image_url'.
            // I'll map it to be safe.
            const formatted = data.map((item: any) => ({
                ...item,
                image_url: item.image || item.image_url // Ensure fallback
            }));
            setItems(formatted.sort((a: any, b: any) => a.order - b.order));
        } catch (error) {
            console.error('Failed to load images:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        let successCount = 0;

        try {
            // Dynamically import to ensure client-side compatibility if needed, though usually fine at top
            const { uploadImage } = await import('@/app/actions/upload-image');

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const uploadFormData = new FormData();
                uploadFormData.append('file', file);

                try {
                    const uploadResult = await uploadImage(uploadFormData);

                    if (uploadResult.success && uploadResult.url) {
                        // Create the record with the returned URL
                        const createRes = await createPricingCarouselImage({
                            title: file.name.split('.')[0],
                            image_url: uploadResult.url,
                            active: true,
                            order: items.length + i + 1
                        });

                        if (createRes.success) {
                            successCount++;
                        } else {
                            console.error("Create record failed:", createRes.error);
                            toast.error(`Failed to save ${file.name}: ${createRes.error}`);
                        }
                    } else {
                        console.error("Upload failed:", uploadResult.error);
                        toast.error(`Failed to upload ${file.name}: ${uploadResult.error}`);
                    }
                } catch (err) {
                    console.error("Critical error processing file:", file.name, err);
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully added ${successCount} images`);
                await loadImages();
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Remove this image?')) return;

        try {
            await deletePricingCarouselImage(id);
            setItems(prev => prev.filter(item => item.id !== id));
            toast.success('Image removed');
        } catch (error) {
            console.error('Failed to delete:', error);
            toast.error('Failed to remove image');
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Pricing Carousel Images</h2>
                    <p className="text-sm text-slate-500">Manage images displayed on the pricing page</p>
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

