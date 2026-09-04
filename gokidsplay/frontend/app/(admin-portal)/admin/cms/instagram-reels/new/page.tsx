"use client";

import React from 'react';
import { createInstagramReel } from '@/app/actions/instagram-reels';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewInstagramReelPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Instagram Reel</h1>
                <p className="text-slate-500">Add a new Instagram reel</p>
            </div>

            <CMSForm
                schema={schemas.instagram_reel}
                onSubmit={createInstagramReel}
                submitLabel="Create Instagram Reel"
                backUrl="/admin/cms/instagram-reels"
            />
        </div>
    );
}

