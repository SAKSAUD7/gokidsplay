"use client";

import React, { useId, useState } from 'react';
import { Upload, X, Image as ImageIcon, Film, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/media-utils';

type MediaKind = 'image' | 'video';

const LIMITS: Record<MediaKind, { maxMb: number; accept: string; types: string[]; label: string }> = {
    image: {
        maxMb: 15,
        accept: 'image/jpeg,image/png,image/webp',
        types: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        label: 'JPG, PNG or WEBP · up to 15MB',
    },
    video: {
        maxMb: 200,
        accept: 'video/mp4,video/webm,video/quicktime',
        types: ['video/mp4', 'video/webm', 'video/quicktime'],
        label: 'MP4, WEBM or MOV · up to 200MB',
    },
};

interface MediaUploadFieldProps {
    kind: MediaKind;
    label: string;
    value: string;
    onChange: (value: string) => void;
    help?: string;
    placeholder?: string;
}

/**
 * Upload (or paste a URL for) an image or video. Uploads go through the
 * /api/cms/video-upload route handler, which forwards the admin cookie to Django
 * and — unlike a server action — has no 1MB request-body limit.
 */
export function MediaUploadField({ kind, label, value, onChange, help, placeholder }: MediaUploadFieldProps) {
    const inputId = useId();
    const [progress, setProgress] = useState<number | null>(null);
    const limits = LIMITS[kind];

    const upload = (file: File) => {
        if (!limits.types.includes(file.type)) {
            toast.error(`Unsupported file type (${file.type || 'unknown'}). Allowed: ${limits.label}`);
            return;
        }
        if (file.size > limits.maxMb * 1024 * 1024) {
            toast.error(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is ${limits.maxMb}MB`);
            return;
        }

        const form = new FormData();
        form.append('file', file);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/cms/video-upload');
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            setProgress(null);
            let data: any = {};
            try { data = JSON.parse(xhr.responseText); } catch { /* non-JSON error page */ }
            if (xhr.status >= 200 && xhr.status < 300 && data.url) {
                onChange(data.url);
                toast.success(`${kind === 'image' ? 'Image' : 'Video'} uploaded`);
            } else if (xhr.status === 401) {
                toast.error('Your session has expired — please log in again');
            } else {
                toast.error(data.error || `Upload failed (${xhr.status})`);
            }
        };
        xhr.onerror = () => {
            setProgress(null);
            toast.error('Upload failed — check your connection and try again');
        };
        setProgress(0);
        xhr.send(form);
    };

    const preview = value ? getMediaUrl(value) : '';
    const isYouTube = /youtube\.com|youtu\.be|vimeo\.com/i.test(value || '');

    return (
        <div className="space-y-2">
            <label htmlFor={inputId} className="text-sm font-medium text-slate-700">{label}</label>

            <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="relative w-40 h-28 shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 group flex items-center justify-center">
                    {!value ? (
                        <div className="flex flex-col items-center text-slate-400">
                            {kind === 'image' ? <ImageIcon className="w-7 h-7 mb-1" /> : <Film className="w-7 h-7 mb-1" />}
                            <span className="text-xs">None</span>
                        </div>
                    ) : kind === 'image' ? (
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                    ) : isYouTube ? (
                        <div className="flex flex-col items-center text-slate-500 px-2 text-center">
                            <Film className="w-7 h-7 mb-1" />
                            <span className="text-xs">Linked video</span>
                        </div>
                    ) : (
                        <video src={preview} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    )}
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-slate-600 hover:bg-red-50 hover:text-red-500 shadow-sm"
                            title="Remove"
                            aria-label={`Remove ${kind}`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex-1 w-full space-y-2">
                    <input
                        id={inputId}
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || (kind === 'image' ? 'Upload, or paste an image URL' : 'Upload, or paste a video URL (MP4 / YouTube)')}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <label
                        className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                            progress !== null ? 'bg-slate-300 text-slate-600 cursor-wait' : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                        }`}
                    >
                        <Upload className="w-4 h-4" />
                        {progress !== null ? `Uploading… ${progress}%` : `Upload ${kind === 'image' ? 'image' : 'video'}`}
                        <input
                            type="file"
                            accept={limits.accept}
                            className="hidden"
                            disabled={progress !== null}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) upload(file);
                                e.target.value = '';
                            }}
                        />
                    </label>
                    {progress !== null && (
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                    )}
                    <p className="text-xs text-slate-500 flex items-start gap-1">
                        {help && <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />}
                        <span>{help ? `${help} · ` : ''}{limits.label}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
