'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CollectionList } from '../CollectionList';
import { schemas } from '@/lib/cms/schema';
import { deleteGroupBenefit } from '@/app/actions/group-benefits';

interface GroupBenefitsManagerProps {
    items: any[];
}

export function GroupBenefitsManager({ items }: GroupBenefitsManagerProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Group Benefits</h2>
                    <p className="text-sm text-slate-500">Manage benefit cards displayed on groups page</p>
                </div>
                <Link
                    href="/admin/cms/group-benefits/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Benefit
                </Link>
            </div>

            <div className="p-6">
                <CollectionList
                    schema={schemas.group_benefit}
                    items={items}
                    onDelete={deleteGroupBenefit}
                    basePath="/admin/cms/group-benefits"
                    titleField="title"
                    subtitleField="description"
                    showBackButton={false}
                />
            </div>
        </div>
    );
}
