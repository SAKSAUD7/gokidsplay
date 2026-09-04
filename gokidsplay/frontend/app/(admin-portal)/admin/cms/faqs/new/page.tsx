"use client";

import React from 'react';
import { createFaq } from '@/app/actions/faqs';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewFaqPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New FAQ</h1>
                <p className="text-slate-500">Create a new frequently asked question</p>
            </div>

            <CMSForm
                schema={schemas.faq}
                onSubmit={createFaq}
                submitLabel="Create FAQ"
                backUrl="/admin/cms/faqs"
            />
        </div>
    );
}
