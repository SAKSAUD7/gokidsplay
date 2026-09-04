'use client';

import React, { useState, useEffect } from 'react';
import { Video, Link as LinkIcon, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { getAttractionVideo, updateAttractionVideo } from '@/app/actions/attraction-video';

interface VideoData {
    title: string;
    video: string;
    is_active: boolean;
}

// Helper function to convert YouTube URLs to embed URLs
function getYouTubeEmbedUrl(url: string): string | null {
    if (!url) return null;

    // Handle youtube.com/watch?v=VIDEO_ID
    if (url.includes('youtube.com/watch')) {
        try {
            const videoId = new URL(url).searchParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        } catch {
            return null;
        }
    }
    // Handle youtu.be/VIDEO_ID
    if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    // Handle youtube.com/shorts/VIDEO_ID
    if (url.includes('youtube.com/shorts/')) {
        const videoId = url.split('/shorts/')[1]?.split('?')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return null;
}

interface AttractionVideoManagerProps {
    initialData?: VideoData | null;
}

export function AttractionVideoManager({ initialData }: AttractionVideoManagerProps) {
    const [data, setData] = useState<VideoData>({
        title: initialData?.title || '',
        video: initialData?.video || '',
        is_active: initialData?.is_active !== undefined ? initialData.is_active : true
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!initialData);

    // Load existing data if not provided via props
    useEffect(() => {
        if (initialData) return;

        async function loadData() {
            try {
                const result = await getAttractionVideo();
                if (result) {
                    setData({
                        title: result.title || '',
                        video: result.video || '',
                        is_active: result.is_active !== undefined ? result.is_active : true
                    });
                }
            } catch (error) {
                console.error('Failed to load video data:', error);
            } finally {
                setInitialLoading(false);
            }
        }
        loadData();
    }, [initialData]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                title: data.title,
                video_url: data.video,
                is_active: data.is_active
            };

            const result = await updateAttractionVideo(payload);

            if (result.success) {
                toast.success('Video section saved successfully!');
                if (result.item) {
                    setData({
                        title: result.item.title || '',
                        video: result.item.video || '',
                        is_active: result.item.is_active !== undefined ? result.item.is_active : true
                    });
                }
            } else {
                toast.error(result.error || 'Failed to save');
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const youtubeEmbedUrl = getYouTubeEmbedUrl(data.video);
    const isYouTubeUrl = data.video && (data.video.includes('youtube.com') || data.video.includes('youtu.be'));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Video className="w-6 h-6 text-primary" />
                        Attraction Video
                        <span className="text-sm font-normal text-slate-500 ml-2">
                            {data.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Manage the featured video on the Attractions page
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                {/* Enable Toggle */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <input
                        type="checkbox"
                        id="enable-video"
                        checked={data.is_active}
                        onChange={(e) => setData({ ...data, is_active: e.target.checked })}
                        className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="enable-video" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Enable Video Section
                    </label>
                </div>

                {/* Title Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        Section Title (Optional)
                    </label>
                    <input
                        type="text"
                        value={data.title}
                        onChange={(e) => setData({ ...data, title: e.target.value })}
                        placeholder="e.g., Experience the Thrill"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                </div>

                {/* YouTube URL Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        YouTube Video URL
                    </label>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="url"
                            value={data.video}
                            onChange={(e) => setData({ ...data, video: e.target.value })}
                            placeholder="https://youtube.com/shorts/TKflY2nTraQ"
                            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>
                    <p className="text-xs text-slate-500">
                        Paste a YouTube, Vimeo, or other video URL
                    </p>
                </div>

                {/* Video Preview */}
                {data.video && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Preview
                        </label>
                        <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-video">
                            {isYouTubeUrl && youtubeEmbedUrl ? (
                                <iframe
                                    src={youtubeEmbedUrl}
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title="Video Preview"
                                />
                            ) : (
                                <video
                                    src={data.video}
                                    controls
                                    className="absolute inset-0 w-full h-full object-cover"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            <button
                                onClick={() => setData({ ...data, video: '' })}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                                title="Remove video"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
