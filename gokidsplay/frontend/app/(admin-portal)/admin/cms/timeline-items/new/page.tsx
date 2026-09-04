"use client";

import React from 'react';
import { createTimelineItem } from '@/app/actions/timeline-items';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewTimelineItemPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Timeline Item</h1>
                <p className="text-slate-500">Add a new timeline event</p>
            </div>

            <CMSForm
                schema={schemas.timeline_item}
                onSubmit={createTimelineItem}
                submitLabel="Create Timeline Item"
                backUrl="/admin/cms/timeline-items"
            />
        </div>
    );
}

