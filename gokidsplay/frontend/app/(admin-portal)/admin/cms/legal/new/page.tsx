'use client';

import React from 'react';
import { createLegalDocument } from '@/app/actions/legal-documents';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewLegalDocumentPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const result = await createLegalDocument(data);
        if (result.success) {
            toast.success('Document created');
            router.push('/admin/cms/legal');
        } else {
            toast.error('Failed to create document');
        }
        return result;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">New Legal Document</h1>
                <p className="text-slate-500">Create a new legal document.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <CMSForm
                    schema={schemas.legal_document}
                    onSubmit={handleSubmit}
                    submitLabel="Create Document"
                />
            </div>
        </div>
    );
}

