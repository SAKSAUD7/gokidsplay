'use client';

import React from 'react';
import { createGuidelineCategory } from '@/app/actions/guideline-categories';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewGuidelinePage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const result = await createGuidelineCategory(data);
        if (result.success) {
            toast.success('Category created');
            router.push('/admin/cms/guidelines');
        } else {
            toast.error('Failed to create category');
        }
        return result;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">New Guideline Category</h1>
                <p className="text-slate-500">Create a new guideline category.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <CMSForm
                    schema={schemas.guideline_category}
                    onSubmit={handleSubmit}
                    submitLabel="Create Category"
                />
            </div>
        </div>
    );
}

