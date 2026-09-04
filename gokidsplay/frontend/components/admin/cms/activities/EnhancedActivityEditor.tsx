"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Plus, Trash2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ActivityEditorProps {
    activityId?: string;
    onSave?: () => void;
}

export function EnhancedActivityEditor({ activityId, onSave }: ActivityEditorProps) {
    const [activity, setActivity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (activityId) {
            loadActivity();
        } else {
            setLoading(false);
        }
    }, [activityId]);

    const loadActivity = async () => {
        try {
            const response = await fetch(`/api/cms/activities/${activityId}/`);
            const data = await response.json();
            setActivity(data);
        } catch (error) {
            toast.error('Failed to load activity');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!activity) return;

        setSaving(true);
        try {
            const url = activityId
                ? `/api/cms/activities/${activityId}/`
                : '/api/cms/activities/';

            const method = activityId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activity)
            });

            if (response.ok) {
                toast.success('Activity saved successfully!');
                if (onSave) onSave();
            } else {
                toast.error('Failed to save activity');
            }
        } catch (error) {
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setActivity((prev: any) => ({ ...prev, [field]: value }));
    };

    const addFAQ = () => {
        const faqs = activity?.activity_faqs || [];
        updateField('activity_faqs', [...faqs, { question: '', answer: '' }]);
    };

    const removeFAQ = (index: number) => {
        const faqs = activity?.activity_faqs || [];
        updateField('activity_faqs', faqs.filter((_: any, i: number) => i !== index));
    };

    const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
        const faqs = activity?.activity_faqs || [];
        const updated = faqs.map((faq: any, i: number) =>
            i === index ? { ...faq, [field]: value } : faq
        );
        updateField('activity_faqs', updated);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Enhanced Activity Editor
                    </h2>
                    <p className="text-sm text-slate-500">Manage detailed activity content</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Basic Fields */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Activity Name
                    </label>
                    <input
                        type="text"
                        value={activity?.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Description
                    </label>
                    <textarea
                        value={activity?.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                {/* Why Choose Us */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Why Choose Us?
                    </label>
                    <textarea
                        value={activity?.why_choose_us || ''}
                        onChange={(e) => updateField('why_choose_us', e.target.value)}
                        rows={4}
                        placeholder="Explain why customers should choose this activity..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        This appears in the expandable "Why Choose Us?" section
                    </p>
                </div>

                {/* What to Expect */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        What to Expect?
                    </label>
                    <textarea
                        value={activity?.what_to_expect || ''}
                        onChange={(e) => updateField('what_to_expect', e.target.value)}
                        rows={4}
                        placeholder="Describe what customers can expect from this activity..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        This appears in the expandable "What to Expect?" section
                    </p>
                </div>

                {/* Location Info */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Location Information
                    </label>
                    <textarea
                        value={activity?.location_info || ''}
                        onChange={(e) => updateField('location_info', e.target.value)}
                        rows={2}
                        placeholder="e.g., Located on the first floor, next to the arcade..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        This appears with a map pin icon in the expanded section
                    </p>
                </div>

                {/* Activity FAQs */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-slate-700">
                            <HelpCircle className="w-4 h-4 inline mr-1" />
                            Activity-Specific FAQs
                        </label>
                        <button
                            onClick={addFAQ}
                            className="px-3 py-1 bg-primary text-white rounded-lg text-sm flex items-center gap-1 hover:bg-primary/90"
                        >
                            <Plus className="w-4 h-4" />
                            Add FAQ
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(activity?.activity_faqs || []).map((faq: any, index: number) => (
                            <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-medium text-slate-900 text-sm">FAQ {index + 1}</h4>
                                    <button
                                        onClick={() => removeFAQ(index)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Question
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Do I need to bring my own skates?"
                                            value={faq.question || ''}
                                            onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Answer
                                        </label>
                                        <textarea
                                            placeholder="Provide a helpful answer..."
                                            value={faq.answer || ''}
                                            onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(!activity?.activity_faqs || activity.activity_faqs.length === 0) && (
                            <p className="text-sm text-slate-500 text-center py-4">
                                No FAQs added yet. Click "Add FAQ" to create one.
                            </p>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? 'Saving...' : 'Save Activity'}
                    </button>
                </div>
            </div>
        </div>
    );
}
