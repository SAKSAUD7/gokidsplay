"use client";

import React from 'react';
import { createLegalDocument } from '@/app/actions/legal-documents';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewLegalDocumentPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Legal Document</h1>
                <p className="text-slate-500">Add a new legal document</p>
            </div>

            <CMSForm
                schema={schemas.legal_document}
                onSubmit={createLegalDocument}
                submitLabel="Create Legal Document"
                backUrl="/admin/cms/legal-documents"
            />
        </div>
    );
}

