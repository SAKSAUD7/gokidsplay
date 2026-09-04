'use client';

import React from 'react';
import { createActivity } from '@/app/actions/activities';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewAttractionPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const result = await createActivity(data);
        if (result.success) {
            toast.success('Attraction created successfully');
            router.push('/admin/cms/attractions');
        } else {
            toast.error('Failed to create attraction');
        }
        return result;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Add New Attraction</h1>
                <p className="text-slate-500">Create a new attraction or activity for the park.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <CMSForm
                    schema={schemas.activity}
                    onSubmit={handleSubmit}
                    submitLabel="Create Attraction"
                />
            </div>
        </div>
    );
}

