"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { getMediaUrl } from "@/lib/media-utils";

interface ImageUploadFieldProps {
    value?: string | File | null;
    onChange: (file: File | null) => void;
    label?: string;
    error?: string;
}

export default function ImageUploadField({ value, onChange, label = "Image", error }: ImageUploadFieldProps) {
    // Convert value to preview URL
    const getPreviewUrl = (val: string | File | null | undefined): string | null => {
        if (!val) return null;
        if (typeof val === 'string') {
            return getMediaUrl(val);
        }
        return URL.createObjectURL(val);
    };

    const [preview, setPreview] = useState<string | null>(getPreviewUrl(value));
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            onChange(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onChange(null);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">{label}</label>

            <div className={`border-2 border-dashed rounded-xl p-4 transition-colors ${error ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-neon-blue bg-slate-50'
                }`}>
                {preview ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-white shadow-sm group">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 py-8 cursor-pointer hover:text-neon-blue text-slate-400 transition-colors"
                    >
                        <Upload size={32} />
                        <span className="text-sm font-medium">Click to upload image</span>
                        <span className="text-xs text-slate-400">JPG, PNG, WEBP up to 5MB</span>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
