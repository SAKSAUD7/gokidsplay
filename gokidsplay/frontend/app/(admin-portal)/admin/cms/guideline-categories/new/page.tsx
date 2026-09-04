"use client";

import React from 'react';
import { createGuidelineCategory } from '@/app/actions/guideline-categories';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewGuidelineCategoryPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Guideline Category</h1>
                <p className="text-slate-500">Add a new guideline category</p>
            </div>

            <CMSForm
                schema={schemas.guideline_category}
                onSubmit={createGuidelineCategory}
                submitLabel="Create Guideline Category"
                backUrl="/admin/cms/guideline-categories"
            />
        </div>
    );
}

