'use client';

import React from 'react';
import { createFacilityItem } from '@/app/actions/facility-items';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewFacilityPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const result = await createFacilityItem(data);
        if (result.success) {
            toast.success('Facility created');
            router.push('/admin/cms/facilities');
        } else {
            toast.error('Failed to create facility');
        }
        return result;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">New Facility</h1>
                <p className="text-slate-500">Add a new facility.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <CMSForm
                    schema={schemas.facility_item}
                    onSubmit={handleSubmit}
                    submitLabel="Create Facility"
                />
            </div>
        </div>
    );
}

