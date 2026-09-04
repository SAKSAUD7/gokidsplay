'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CollectionList } from '../CollectionList';
import { schemas } from '@/lib/cms/schema';
import { deleteFacilityItem } from '@/app/actions/facility-items';

interface FacilitiesManagerProps {
    items: any[];
}

export function FacilitiesManager({ items }: FacilitiesManagerProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Park Facilities</h2>
                    <p className="text-sm text-slate-500">Manage park amenities and facilities</p>
                </div>
                <Link
                    href="/admin/cms/facility-items/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Facility
                </Link>
            </div>

            <div className="p-6">
                <CollectionList
                    schema={schemas.facility_item}
                    items={items}
                    onDelete={deleteFacilityItem}
                    basePath="/admin/cms/facility-items"
                    titleField="name"
                    imageField="image"
                    subtitleField="description"
                    showBackButton={false}
                />
            </div>
        </div>
    );
}
