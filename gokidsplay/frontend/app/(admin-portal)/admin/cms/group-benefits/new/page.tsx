"use client";

import React, { useState } from 'react';
import { createGroupBenefit } from '@/app/actions/group-benefits';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';

export default function NewGroupBenefitPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <CMSBackLink />
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Add Group Benefit</h1>
                <p className="text-slate-500">Create a new benefit card for the groups page</p>
            </div>

            <CMSForm
                schema={schemas.group_benefit}
                onSubmit={createGroupBenefit}
                submitLabel="Create Benefit"
                backUrl="/admin/cms/groups"
            />
        </div>
    );
}
