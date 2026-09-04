import React from 'react';
import { getGroupPackages, deleteGroupPackage } from '@/app/actions/group-packages';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function GroupPackagesPage() {
    const items = await getGroupPackages();

    return (
        <CollectionList
            title="Group Packages"
            description="Manage group booking packages"
            items={items}
            schema={schemas.group_package}
            basePath="/admin/cms/group-packages"
            onDelete={deleteGroupPackage}
        />
    );
}

