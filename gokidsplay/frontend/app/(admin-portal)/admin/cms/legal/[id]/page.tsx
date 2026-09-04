'use client';

import React, { useEffect, useState } from 'react';
import { getLegalDocument, updateLegalDocument } from '@/app/actions/legal-documents';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function EditLegalDocumentPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [params.id]);

    async function loadData() {
        try {
            const data = await getLegalDocument(params.id);
            if (data) {
                setItem(data);
            } else {
                toast.error('Document not found');
                router.push('/admin/cms/legal');
            }
        } catch (error) {
            toast.error('Failed to load document');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (data: any) => {
        const result = await updateLegalDocument(params.id, data);
        if (result.success) {
            toast.success('Document updated');
            router.push('/admin/cms/legal');
        } else {
            toast.error('Failed to update document');
        }
        return result;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!item) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Legal Document</h1>
                <p className="text-slate-500">Update legal document content.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <CMSForm
                    schema={schemas.legal_document}
                    initialData={item}
                    onSubmit={handleSubmit}
                    submitLabel="Update Document"
                />
            </div>
        </div>
    );
}
