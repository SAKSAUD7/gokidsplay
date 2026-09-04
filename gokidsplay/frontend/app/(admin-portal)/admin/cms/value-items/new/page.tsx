"use client";

import React from 'react';
import { createValueItem } from '@/app/actions/value-items';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewValueItemPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Value Item</h1>
                <p className="text-slate-500">Add a new core value</p>
            </div>

            <CMSForm
                schema={schemas.value_item}
                onSubmit={createValueItem}
                submitLabel="Create Value Item"
                backUrl="/admin/cms/value-items"
            />
        </div>
    );
}

