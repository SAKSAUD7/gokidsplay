'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CollectionList } from '../CollectionList';
import { schemas } from '@/lib/cms/schema';
import { deleteGroupPackage } from '@/app/actions/group-packages';

interface GroupPackagesManagerProps {
    items: any[];
}

export function GroupPackagesManager({ items }: GroupPackagesManagerProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Group Packages</h2>
                    <p className="text-sm text-slate-500">Manage group booking packages for schools and corporates</p>
                </div>
                <Link
                    href="/admin/cms/group-packages/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Package
                </Link>
            </div>

            <div className="p-6">
                <CollectionList
                    schema={schemas.group_package}
                    items={items}
                    onDelete={deleteGroupPackage}
                    basePath="/admin/cms/group-packages"
                    titleField="name"
                    subtitleField="description"
                    showBackButton={false}
                />
            </div>
        </div>
    );
}
