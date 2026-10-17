"use client";

import React, { useEffect, useState } from 'react';
import { updateTimingCard, getTimingCard } from '@/app/actions/timing-cards';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditTimingCardPage({ params }: { params: { id: string } }) {
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Load in an effect: a client page can't call server actions while rendering
    useEffect(() => {
        getTimingCard(params.id)
            .then(data => (data ? setItem(data) : toast.error('Timing card not found')))
            .catch(() => toast.error('Failed to load the timing card'))
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!item) {
        return <div className="p-8 text-slate-600">Timing card not found.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Edit Timing Card</h1>
                <p className="text-slate-500">Update operating hours / timing card</p>
            </div>

            <CMSForm
                schema={schemas.timing_card}
                initialData={item}
                onSubmit={(data: any) => updateTimingCard(params.id, data)}
                submitLabel="Save Changes"
                backUrl="/admin/cms/timing-cards"
            />
        </div>
    );
}
