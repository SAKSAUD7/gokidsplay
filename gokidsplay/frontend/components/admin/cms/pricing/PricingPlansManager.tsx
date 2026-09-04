'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CollectionList } from '../CollectionList';
import { schemas } from '@/lib/cms/schema';
import { deletePricingPlan } from '@/app/actions/pricing-plans';

interface PricingPlansManagerProps {
    items: any[];
}

export function PricingPlansManager({ items }: PricingPlansManagerProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Pricing Plans</h2>
                    <p className="text-sm text-slate-500">Manage session and party pricing options</p>
                </div>
                <Link
                    href="/admin/cms/pricing-plans/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Plan
                </Link>
            </div>

            <div className="p-6">
                <CollectionList
                    schema={schemas.pricing_plan}
                    items={items}
                    onDelete={deletePricingPlan}
                    basePath="/admin/cms/pricing-plans"
                    titleField="name"
                    subtitleField="type"
                    showBackButton={false}
                />
            </div>
        </div>
    );
}
