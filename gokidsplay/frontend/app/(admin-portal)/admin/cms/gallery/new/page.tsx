"use client";

import React from 'react';
import { createGalleryItem } from '@/app/actions/gallery';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewGalleryItemPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Gallery Item</h1>
                <p className="text-slate-500">Add a new photo to the gallery</p>
            </div>

            <CMSForm
                schema={schemas.gallery_item}
                onSubmit={createGalleryItem}
                submitLabel="Create Gallery Item"
                backUrl="/admin/cms/gallery"
            />
        </div>
    );
}

