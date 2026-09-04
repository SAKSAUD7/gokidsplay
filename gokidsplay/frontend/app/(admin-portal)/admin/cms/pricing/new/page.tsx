'use client';

import React from 'react';
import { createPricingPlan } from '@/app/actions/pricing-plans';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewPricingPlanPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const result = await createPricingPlan(data);
        if (result.success) {
            toast.success('Plan created');
            router.push('/admin/cms/pricing');
        } else {
            toast.error('Failed to create plan');
        }
        return result;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">New Pricing Plan</h1>
                <p className="text-slate-500">Create a new pricing plan.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <CMSForm
                    schema={schemas.pricing_plan}
                    onSubmit={handleSubmit}
                    submitLabel="Create Plan"
                />
            </div>
        </div>
    );
}

