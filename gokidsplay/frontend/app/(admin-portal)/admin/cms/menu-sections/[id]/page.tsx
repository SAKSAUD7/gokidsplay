"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMenuSection, updateMenuSection } from '@/app/actions/menu-sections';
import { MenuSectionEditor } from '@/components/admin/cms/MenuSectionEditor';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditMenuSectionPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadItem() {
            try {
                const data = await getMenuSection(params.id);
                if (data) {
                    setItem(data);
                } else {
                    toast.error('Item not found');
                }
            } catch (error) {
                toast.error('Failed to load item');
            } finally {
                setLoading(false);
            }
        }
        loadItem();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!item) {
        return <div>Item not found</div>;
    }

    return (
        <MenuSectionEditor
            initialData={item}
            onSave={(data) => updateMenuSection(params.id, data)}
            onCancel={() => router.push('/admin/cms/menu-sections')}
        />
    );
}
