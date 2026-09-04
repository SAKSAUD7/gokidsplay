"use client";

import React, { useEffect, useState } from 'react';
import { getLegalDocuments, updateLegalDocument } from '@/app/actions/legal-documents';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WaiverTermsPage() {
    const [waiverTerms, setWaiverTerms] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const legalDocs = await getLegalDocuments() as any[];
                const waiver = legalDocs.find(doc => doc.document_type === 'WAIVER_TERMS');
                setWaiverTerms(waiver);
            } catch (error) {
                toast.error('Failed to load waiver terms');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleSave = async () => {
        if (!waiverTerms) return;

        setSaving(true);
        try {
            const result = await updateLegalDocument(waiverTerms.id, waiverTerms);
            if (result.success) {
                toast.success('Waiver terms updated successfully!');
            } else {
                toast.error(result.error || 'Failed to update waiver terms');
            }
        } catch (error) {
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!waiverTerms) {
        return (
            <div className="space-y-8 max-w-4xl mx-auto pb-20">
                <CMSBackLink />
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                    <p className="text-slate-500">No waiver terms found in database.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <CMSBackLink />
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Waiver Terms & Conditions</h1>
                <p className="text-slate-500">Modify waiver terms content</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                    <input
                        type="text"
                        value={waiverTerms.title}
                        onChange={(e) => setWaiverTerms({ ...waiverTerms, title: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                {/* Intro */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Introduction</label>
                    <textarea
                        value={waiverTerms.intro || ''}
                        onChange={(e) => setWaiverTerms({ ...waiverTerms, intro: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                {/* Sections */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Sections ({waiverTerms.sections?.length || 0})
                    </label>
                    <div className="space-y-4">
                        {(waiverTerms.sections || []).map((section: any, index: number) => (
                            <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                                <input
                                    type="text"
                                    value={section.title}
                                    onChange={(e) => {
                                        const newSections = [...waiverTerms.sections];
                                        newSections[index].title = e.target.value;
                                        setWaiverTerms({ ...waiverTerms, sections: newSections });
                                    }}
                                    placeholder="Section Title"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                                />
                                <textarea
                                    value={section.content}
                                    onChange={(e) => {
                                        const newSections = [...waiverTerms.sections];
                                        newSections[index].content = e.target.value;
                                        setWaiverTerms({ ...waiverTerms, sections: newSections });
                                    }}
                                    placeholder="Section Content"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
