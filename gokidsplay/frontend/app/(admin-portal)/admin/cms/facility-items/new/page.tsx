"use client";

import React from 'react';
import { createFacilityItem } from '@/app/actions/facility-items';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewFacilityItemPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Facility Item</h1>
                <p className="text-slate-500">Add a new facility</p>
            </div>

            <CMSForm
                schema={schemas.facility_item}
                onSubmit={createFacilityItem}
                submitLabel="Create Facility Item"
                backUrl="/admin/cms/attractions"
            />
        </div>
    );
}

