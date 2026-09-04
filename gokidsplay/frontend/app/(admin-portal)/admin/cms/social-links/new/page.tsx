"use client";

import React from 'react';
import { createSocialLink } from '@/app/actions/social-links';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewSocialLinkPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Social Link</h1>
                <p className="text-slate-500">Add a new social media profile</p>
            </div>

            <CMSForm
                schema={schemas.social_link}
                onSubmit={createSocialLink}
                submitLabel="Create Social Link"
                backUrl="/admin/cms/social-links"
            />
        </div>
    );
}

