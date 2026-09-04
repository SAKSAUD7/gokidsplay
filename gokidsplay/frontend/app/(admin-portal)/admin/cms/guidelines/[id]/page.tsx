'use client';

import React, { useEffect, useState } from 'react';
import { getGuidelineCategory, updateGuidelineCategory } from '@/app/actions/guideline-categories';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function EditGuidelinePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [params.id]);

    async function loadData() {
        try {
            const data = await getGuidelineCategory(params.id);
            if (data) {
                setItem(data);
            } else {
                toast.error('Category not found');
                router.push('/admin/cms/guidelines');
            }
        } catch (error) {
            toast.error('Failed to load category');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (data: any) => {
        const result = await updateGuidelineCategory(params.id, data);
        if (result.success) {
            toast.success('Category updated');
            router.push('/admin/cms/guidelines');
        } else {
            toast.error('Failed to update category');
        }
        return result;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!item) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Guideline Category</h1>
                <p className="text-slate-500">Update safety guidelines category.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <CMSForm
                    schema={schemas.guideline_category}
                    initialData={item}
                    onSubmit={handleSubmit}
                    submitLabel="Update Category"
                />
            </div>
        </div>
    );
}
