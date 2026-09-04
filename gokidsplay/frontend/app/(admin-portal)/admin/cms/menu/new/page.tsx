'use client';

import React from 'react';
import { createMenuSection } from '@/app/actions/menu-sections';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewMenuSectionPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const result = await createMenuSection(data);
        if (result.success) {
            toast.success('Section created');
            router.push('/admin/cms/menu');
        } else {
            toast.error('Failed to create section');
        }
        return result;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">New Menu Section</h1>
                <p className="text-slate-500">Create a new menu category.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <CMSForm
                    schema={schemas.menu_section}
                    onSubmit={handleSubmit}
                    submitLabel="Create Section"
                />
            </div>
        </div>
    );
}

