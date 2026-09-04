'use client';

import React, { useEffect, useState } from 'react';
import { getMenuSections, deleteMenuSection } from '@/app/actions/menu-sections';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuSectionsPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await getMenuSections();
            setItems(data);
        } catch (error) {
            toast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id: string) => {
        const result = await deleteMenuSection(id);
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
                <h1 className="text-2xl font-bold text-slate-900">Cafe Menu</h1>
                <p className="text-slate-500">Manage food and beverage menu items.</p>
            </div>

            <CollectionList
                schema={schemas.menu_section}
                items={items}
                onDelete={handleDelete}
                basePath="/admin/cms/menu"
                titleField="category"
                subtitleField="items"
            />
        </div>
    );
}

