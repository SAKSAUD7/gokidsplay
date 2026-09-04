"use client";

import React from 'react';
import { createGroupPackage } from '@/app/actions/group-packages';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewGroupPackagePage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Group Package</h1>
                <p className="text-slate-500">Add a new group package</p>
            </div>

            <CMSForm
                schema={schemas.group_package}
                onSubmit={createGroupPackage}
                submitLabel="Create Group Package"
                backUrl="/admin/cms/group-packages"
            />
        </div>
    );
}

