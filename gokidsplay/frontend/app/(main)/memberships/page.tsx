import React from 'react';
import { getMetadata } from '@/seo/seo.config';
import { getMembershipPlans } from '@/app/actions/memberships';
import Link from 'next/link';
import { getPublicPageContent } from '@/lib/public-api';
import { getMediaUrl } from '@/lib/media-utils';

export const metadata = getMetadata(
    "Memberships & Season Passes",
    "Join Go Kids Play with our exclusive memberships and season passes for unlimited fun, special discounts, and VIP access."
);

export const dynamic = 'force-dynamic';

export default async function MembershipsPage() {
    const [plansRaw, content] = await Promise.all([getMembershipPlans(), getPublicPageContent('memberships')]);
    const { hero, cards } = content;
    
    // Sort plans by price (lowest to highest)
    const plans = plansRaw
        .filter((p: any) => p.active !== false)
        .sort((a: any, b: any) => Number(a.price) - Number(b.price));

    return (
        <main className="min-h-screen bg-brand-dark pt-32 pb-20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-brand-pink/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-brand-cyan/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 uppercase tracking-tight">
                        {hero?.title ?? "Go Kids Play"} <span className="text-brand-lime">{hero?.title_highlight ?? "Memberships"}</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/70">
                        {hero?.subtitle}
                    </p>
                </div>
                
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.length === 0 ? (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-white/60 py-12">
                            <p className="text-xl">{hero?.empty_text}</p>
                        </div>
                    ) : (
                        plans.map((plan: any, index: number) => {
                            const isBestValue = plan.name.toLowerCase().includes('annual') || index === 1;
                            const isMonthly = plan.duration_days === 30;
                            const periodText = isMonthly ? '/mo' : (plan.duration_days === 365 ? '/yr' : '');
                            
                            // Split description by newlines
                            const features = (plan.description || '').split('\n').filter((f: string) => f.trim() !== '');
                            
                            return (
                                <div 
                                    key={plan.id}
                                    className={`rounded-2xl p-8 backdrop-blur-sm text-center relative ${
                                        isBestValue 
                                        ? 'bg-gradient-to-br from-brand-pink/20 to-brand-cyan/20 border border-brand-pink/50' 
                                        : 'bg-white/5 border border-white/10'
                                    }`}
                                >
                                    {isBestValue && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-pink text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                            {cards?.best_value ?? "Best Value"}
                                        </div>
                                    )}
                                    {plan.image_url && (
                                        <img
                                            src={getMediaUrl(plan.image_url)}
                                            alt={plan.name}
                                            className="w-full aspect-[16/9] object-cover rounded-xl mb-6"
                                            loading="lazy"
                                        />
                                    )}
                                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                    <p className={`${isBestValue ? 'text-brand-pink' : 'text-brand-cyan'} text-4xl font-black mb-6`}>
                                        £{Number(plan.price).toFixed(2).replace(/\.00$/, '')}
                                        <span className="text-lg font-normal text-white/50">{periodText}</span>
                                    </p>
                                    <ul className="text-left space-y-3 mb-8 text-white/80">
                                        {features.map((feature: string, fIdx: number) => (
                                            <li key={fIdx}>{feature}</li>
                                        ))}
                                    </ul>
                                    <Link href={cards?.button_link || "/contact"} className={`block w-full py-3 px-6 font-bold rounded-full transition-colors ${
                                        isBestValue
                                        ? 'bg-brand-pink text-white hover:bg-white hover:text-brand-pink'
                                        : 'bg-brand-lime text-black hover:bg-white'
                                    }`}>
                                        {cards?.button_text ?? "Purchase"}
                                    </Link>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </main>
    );
}

