"use client";

import React from 'react';
import { updateTimingCard, getTimingCard } from '@/app/actions/timing-cards';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { notFound } from 'next/navigation';

export default async function EditTimingCardPage({ params }: { params: { id: string } }) {
    const item = await getTimingCard(params.id);
    if (!item) notFound();

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
