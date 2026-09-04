"use client";

import React from 'react';
import { createContactInfo } from '@/app/actions/contact-info';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewContactInfoPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Contact Info</h1>
                <p className="text-slate-500">Add new contact information</p>
            </div>

            <CMSForm
                schema={schemas.contact_info}
                onSubmit={createContactInfo}
                submitLabel="Create Contact Info"
                backUrl="/admin/cms/contact-info"
            />
        </div>
    );
}

