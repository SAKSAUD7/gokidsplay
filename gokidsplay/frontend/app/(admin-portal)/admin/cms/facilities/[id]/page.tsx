'use client';

import React, { useEffect, useState } from 'react';
import { getFacilityItem, updateFacilityItem } from '@/app/actions/facility-items';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function EditFacilityPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [params.id]);

    async function loadData() {
        try {
            const data = await getFacilityItem(params.id);
            if (data) {
                setItem(data);
            } else {
                toast.error('Facility not found');
                router.push('/admin/cms/facilities');
            }
        } catch (error) {
            toast.error('Failed to load facility');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (data: any) => {
        const result = await updateFacilityItem(params.id, data);
        if (result.success) {
            toast.success('Facility updated');
            router.push('/admin/cms/facilities');
        } else {
            toast.error('Failed to update facility');
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
                <h1 className="text-2xl font-bold text-slate-900">Edit Facility</h1>
                <p className="text-slate-500">Update facility details.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <CMSForm
                    schema={schemas.facility_item}
                    initialData={item}
                    onSubmit={handleSubmit}
                    submitLabel="Update Facility"
                />
            </div>
        </div>
    );
}
