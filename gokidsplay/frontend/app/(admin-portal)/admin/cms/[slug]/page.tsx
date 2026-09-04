"use client";

import React, { useEffect, useState } from 'react';
import { getPage, updatePage } from '@/app/actions/pages';
import { getPageSections, createPageSection, updatePageSection, deletePageSection } from '@/app/actions/page-sections';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { PageSectionEditor } from '@/components/admin/cms/PageSectionEditor';
import { schemas } from '@/lib/cms/schema';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function PageEditor({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<any>(null);
    const [sections, setSections] = useState<any[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [pageData, sectionsData] = await Promise.all([
                    getPage(params.slug),
                    getPageSections(params.slug)
                ]);
                setPage(pageData);
                setSections(sectionsData);
            } catch (error) {
                toast.error('Failed to load page data');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [params.slug]);

    const handlePageUpdate = async (data: any) => {
        const result = await updatePage(params.slug, data);
        if (result.success) {
            router.refresh();
        }
        return result;
    };

    const handleSectionUpdate = async (section: any) => {
        const result = await updatePageSection(section.id, section);
        if (result.success) {
            setSections(prev => prev.map(s => s.id === section.id ? result.item || section : s));
            toast.success('Section updated');
        } else {
            toast.error('Failed to update section');
        }
    };

    const handleSectionCreate = async () => {
        const newSection = {
            page: params.slug,
            section_key: `new-section-${Date.now()}`,
            title: 'New Section',
            active: true,
            order: sections.length
        };

        const result = await createPageSection(newSection);
        if (result.success && result.item) {
            setSections(prev => [...prev, result.item]);
            toast.success('Section created');
        } else {
            toast.error('Failed to create section');
        }
    };

    const handleSectionDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this section?')) return;

        const result = await deletePageSection(id);
        if (result.success) {
            setSections(prev => prev.filter(s => s.id !== id));
            toast.success('Section deleted');
        } else {
            toast.error('Failed to delete section');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!page) {
        return <div>Page not found</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Page: {page.title}</h1>
                <p className="text-slate-500">/{page.slug}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Page Metadata */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        <CMSForm
                            schema={schemas.page}
                            initialData={page}
                            onSubmit={handlePageUpdate}
                            submitLabel="Update Metadata"
                        />
                    </div>
                </div>

                {/* Right Column: Page Sections */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Content Sections</h2>
                        <button
                            onClick={handleSectionCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Section
                        </button>
                    </div>

                    <div className="space-y-4">
                        {sections.map((section) => (
                            <PageSectionEditor
                                key={section.id}
                                section={section}
                                onChange={handleSectionUpdate}
                                onDelete={() => handleSectionDelete(section.id)}
                            />
                        ))}

                        {sections.length === 0 && (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                                No sections found. Add one to get started.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
