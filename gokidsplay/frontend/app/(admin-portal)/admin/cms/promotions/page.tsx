import { getBanners } from '@/app/actions/banners';
import { PromotionsManager } from '@/components/admin/cms/home/PromotionsManager';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';

export const dynamic = 'force-dynamic';

/** Website Content → Promotions slider: offer and voucher images on the homepage. */
export default async function PromotionsPage() {
    const promotions = await getBanners();
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <CMSBackLink />
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Homepage promotions</h1>
                <p className="text-slate-500">
                    Add images of your vouchers and offers. They appear in a slider on the homepage, just under the
                    opening hours. With no images (or all switched off), the slider doesn&apos;t show.
                </p>
            </div>
            <PromotionsManager items={promotions} />
        </div>
    );
}
