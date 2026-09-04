"use client";

import React from 'react';
import { createTimingCard } from '@/app/actions/timing-cards';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewTimingCardPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Timing Card</h1>
                <p className="text-slate-500">Add a new operating hours / timing card</p>
            </div>

            <CMSForm
                schema={schemas.timing_card}
                onSubmit={createTimingCard}
                submitLabel="Create Timing Card"
                backUrl="/admin/cms/timing-cards"
            />
        </div>
    );
}
