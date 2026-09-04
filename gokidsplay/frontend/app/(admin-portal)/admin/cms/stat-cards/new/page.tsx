"use client";

import React from 'react';
import { createStatCard } from '@/app/actions/stat-cards';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewStatCardPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Stat Card</h1>
                <p className="text-slate-500">Add a new statistic card</p>
            </div>

            <CMSForm
                schema={schemas.stat_card}
                onSubmit={createStatCard}
                submitLabel="Create Stat Card"
                backUrl="/admin/cms/stat-cards"
            />
        </div>
    );
}

