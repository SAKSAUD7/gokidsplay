'use client';

import React from 'react';
import { createPartyPackage } from '@/app/actions/party-packages';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewPartyPackagePage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const result = await createPartyPackage(data);
        if (result.success) {
            toast.success('Package created');
            router.push('/admin/cms/party-packages');
        } else {
            toast.error('Failed to create package');
        }
        return result;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">New Party Package</h1>
                <p className="text-slate-500">Create a new party package.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <CMSForm
                    schema={schemas.party_package}
                    onSubmit={handleSubmit}
                    submitLabel="Create Package"
                />
            </div>
        </div>
    );
}

