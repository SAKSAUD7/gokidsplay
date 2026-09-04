'use client';

import React, { useEffect, useState } from 'react';
import { getPartyPackages, deletePartyPackage } from '@/app/actions/party-packages';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PartyPackagesPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await getPartyPackages();
            setItems(data);
        } catch (error) {
            toast.error('Failed to load party packages');
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id: string) => {
        const result = await deletePartyPackage(id);
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
                <h1 className="text-2xl font-bold text-slate-900">Party Packages</h1>
                <p className="text-slate-500">Manage birthday party packages and options.</p>
            </div>

            <CollectionList
                schema={schemas.party_package}
                items={items}
                onDelete={handleDelete}
                basePath="/admin/cms/party-packages"
                titleField="name"
                subtitleField="description"
            />
        </div>
    );
}

