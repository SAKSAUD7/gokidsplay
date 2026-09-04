import React from 'react';
import { getPricingPlans, deletePricingPlan } from '@/app/actions/pricing-plans';
import { CollectionList } from '@/components/admin/cms/CollectionList';
import { schemas } from '@/lib/cms/schema';

export default async function PricingPlansPage() {
    const [pricingPlans, partyPackages] = await Promise.all([
        getPricingPlans(),
        import('@/app/actions/party-packages').then(mod => mod.getPartyPackages())
    ]) as [any[], any[]];

    const { deletePartyPackage } = await import('@/app/actions/party-packages');

    return (
        <div className="space-y-12">
            <CollectionList
                title="Session Pricing"
                description="Manage standard entry and session pricing"
                items={pricingPlans}
                schema={schemas.pricing_plan}
                basePath="/admin/cms/pricing-plans"
                onDelete={deletePricingPlan}
            />

            <div className="border-t border-slate-200 pt-12">
                <CollectionList
                    title="Party Packages"
                    description="Manage birthday party and event packages"
                    items={partyPackages}
                    schema={schemas.party_package}
                    basePath="/admin/cms/party-packages" // This needs a dedicated edit page or reuse pricing edit with type
                    onDelete={deletePartyPackage}
                />
            </div>
        </div>
    );
}

