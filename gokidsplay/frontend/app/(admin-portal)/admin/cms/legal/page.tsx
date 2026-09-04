'use client';

import React, { useEffect, useState } from 'react';
import { getLegalDocuments, deleteLegalDocument } from '@/app/actions/legal-documents';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LegalDocumentsPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await getLegalDocuments();
            setItems(data);
        } catch (error) {
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id: string) => {
        const result = await deleteLegalDocument(id);
        if (result.success) {
            setItems(prev => prev.filter(item => item.id !== id));
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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Legal Documents</h1>
                <p className="text-slate-500">Manage privacy policy, terms, and waivers.</p>
            </div>

            <CollectionList
                schema={schemas.legal_document}
                items={items}
                onDelete={handleDelete}
                basePath="/admin/cms/legal"
                titleField="title"
                subtitleField="document_type"
            />
        </div>
    );
}

