import React from 'react';
import { getLegalDocuments, deleteLegalDocument } from '@/app/actions/legal-documents';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function LegalDocumentsPage() {
    const items = await getLegalDocuments();

    return (
        <CollectionList
            title="Legal Documents"
            description="Manage terms, privacy policy, and waivers"
            items={items}
            schema={schemas.legal_document}
            basePath="/admin/cms/legal-documents"
            onDelete={deleteLegalDocument}
        />
    );
}

