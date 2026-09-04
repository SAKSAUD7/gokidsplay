"use client";

import React, { useEffect, useState } from 'react';
import { getGuidelineCategory, updateGuidelineCategory } from '@/app/actions/guideline-categories';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditGuidelineCategoryPage({ params }: { params: { id: string } }) {
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadItem() {
            try {
                const data = await getGuidelineCategory(params.id);
                if (data) {
                    setItem(data);
                } else {
                    toast.error('Item not found');
                }
            } catch (error) {
                toast.error('Failed to load item');
            } finally {
                setLoading(false);
            }
        }
        loadItem();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!item) {
        return <div>Item not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Edit Guideline Category</h1>
                <p className="text-slate-500">Update guideline category details</p>
            </div>

            <CMSForm
                schema={schemas.guideline_category}
                initialData={item}
                onSubmit={(data) => updateGuidelineCategory(params.id, data)}
                submitLabel="Update Guideline Category"
                backUrl="/admin/cms/guideline-categories"
            />
        </div>
    );
}
