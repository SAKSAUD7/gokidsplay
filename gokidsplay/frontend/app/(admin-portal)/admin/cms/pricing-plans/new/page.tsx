"use client";

import React from 'react';
import { createPricingPlan } from '@/app/actions/pricing-plans';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewPricingPlanPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Pricing Plan</h1>
                <p className="text-slate-500">Add a new pricing plan</p>
            </div>

            <CMSForm
                schema={schemas.pricing_plan}
                onSubmit={createPricingPlan}
                submitLabel="Create Pricing Plan"
                backUrl="/admin/cms/pricing-plans"
            />
        </div>
    );
}

