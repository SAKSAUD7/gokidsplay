"use client";

import React, { useEffect, useState } from 'react';
import { getTimelineItem, updateTimelineItem } from '@/app/actions/timeline-items';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditTimelineItemPage({ params }: { params: { id: string } }) {
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadItem() {
            try {
                const data = await getTimelineItem(params.id);
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
                <h1 className="text-2xl font-bold text-slate-900">Edit Timeline Item</h1>
                <p className="text-slate-500">Update timeline event details</p>
            </div>

            <CMSForm
                schema={schemas.timeline_item}
                initialData={item}
                onSubmit={(data: any) => updateTimelineItem(params.id, data)}
                submitLabel="Update Timeline Item"
                backUrl="/admin/cms/timeline-items"
            />
        </div>
    );
}
