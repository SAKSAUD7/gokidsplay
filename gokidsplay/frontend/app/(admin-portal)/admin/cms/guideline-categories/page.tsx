import React from 'react';
import { getGuidelineCategories, deleteGuidelineCategory } from '@/app/actions/guideline-categories';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function GuidelineCategoriesPage() {
    const items = await getGuidelineCategories();

    return (
        <CollectionList
            title="Guideline Categories"
            description="Manage safety guideline categories"
            items={items}
            schema={schemas.guideline_category}
            basePath="/admin/cms/guideline-categories"
            onDelete={deleteGuidelineCategory}
        />
    );
}

