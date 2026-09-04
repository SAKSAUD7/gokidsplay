'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CollectionList } from '../CollectionList';
import { schemas } from '@/lib/cms/schema';
import { deleteActivity } from '@/app/actions/activities';

interface AttractionsManagerProps {
    items: any[];
}

export function AttractionsManager({ items }: AttractionsManagerProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Attractions</h2>
                    <p className="text-sm text-slate-500">Manage all park attractions and activities</p>
                </div>
                <Link
                    href="/admin/cms/attractions/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Attraction
                </Link>
            </div>

            <div className="p-6">
                <CollectionList
                    schema={schemas.activity}
                    items={items}
                    onDelete={deleteActivity}
                    basePath="/admin/cms/attractions"
                    titleField="name"
                    imageField="image_url"
                    subtitleField="short_description"
                    showBackButton={false}
                />
            </div>
        </div>
    );
}
