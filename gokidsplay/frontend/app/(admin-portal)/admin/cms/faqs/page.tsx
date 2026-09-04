"use client";

import React, { useEffect, useState } from 'react';
import { getFaqs, deleteFaq } from '@/app/actions/faqs';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';
import { Loader2 } from 'lucide-react';

export default function FaqsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await getFaqs();
            setItems(data);
        } catch (error) {
            console.error('Failed to load faqs:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <CollectionList
                title="FAQs"
                description="Manage frequently asked questions"
                schema={schemas.faq}
                items={items}
                basePath="/admin/cms/faqs"
                onDelete={async (id) => {
                    await deleteFaq(id);
                    return { success: true };
                }}
                titleField="question"
                subtitleField="answer"
            />
        </div>
    );
}
