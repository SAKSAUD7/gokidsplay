'use client';

import React, { useState, useEffect, useRef } from 'react';
import { updatePageSection, createPageSection } from '@/app/actions/page-sections';
import { CMSField } from '@/components/admin/cms/CMSField';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { PageSection } from '@/lib/cms/types';

interface AboutEditorProps {
    section: any;
    pageSlug: string;
}

export function AboutEditor({ section: initialSection, pageSlug }: AboutEditorProps) {
    const [section, setSection] = useState(initialSection || {
        page: pageSlug,
        section_key: 'about',
        title: "Leicester's Premier Entertainment Venue",
        content: "Go Kids Play Leicester was born from a simple idea: create a space where people of all ages can enjoy roller skating, bowling, and arcade games together – all under one roof at Navigation Street, Leicester City Centre.",
        image_url: '/images/gokidsplay/unnamed (4).webp',
        active: true,
        order: 1
    });
    const [loading, setLoading] = useState(false);
    const [autoSaveTriggered, setAutoSaveTriggered] = useState(false);
    const previousImageUrl = useRef(section.image_url);

    // Auto-save when image changes
    useEffect(() => {
        if (section.image_url && section.image_url !== previousImageUrl.current) {
            previousImageUrl.current = section.image_url;
            setAutoSaveTriggered(true);
        }
    }, [section.image_url]);

    // Trigger save when auto-save is needed
    useEffect(() => {
        if (autoSaveTriggered) {
            handleSave();
            setAutoSaveTriggered(false);
        }
    }, [autoSaveTriggered]);

    const handleChange = (name: string, value: any) => {
        setSection((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let result;
            if (section.id) {
                result = await updatePageSection(section.id, section);
            } else {
                result = await createPageSection(section);
            }

            if (result.success) {
                toast.success('About section saved');
                if (result.item) setSection(result.item);
            } else {
                toast.error('Failed to save about section');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">About Section</h2>
                    <p className="text-sm text-slate-500">Edit the about us content</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="p-6 space-y-6">
                <CMSField
                    field={{ name: 'title', label: 'Heading', type: 'text', required: true }}
                    value={section.title}
                    onChange={(v: any) => handleChange('title', v)}
                />

                <CMSField
                    field={{ name: 'content', label: 'Description', type: 'textarea', required: true }}
                    value={section.content}
                    onChange={(v: any) => handleChange('content', v)}
                />

                <CMSField
                    field={{ name: 'image_url', label: 'Side Image', type: 'image', required: true }}
                    value={section.image_url}
                    onChange={(v: any) => handleChange('image_url', v)}
                    idPrefix="about"
                />
            </div>
        </div>
    );
}
