"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { createMenuSection } from '@/app/actions/menu-sections';
import { MenuSectionEditor } from '@/components/admin/cms/MenuSectionEditor';

export default function NewMenuSectionPage() {
    const router = useRouter();

    return (
        <MenuSectionEditor
            onSave={createMenuSection}
            onCancel={() => router.push('/admin/cms/menu-sections')}
        />
    );
}
