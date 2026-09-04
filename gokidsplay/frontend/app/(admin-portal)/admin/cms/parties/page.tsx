import React from 'react';
import { getPageSections } from '@/app/actions/page-sections';
import { getPartyPackages } from '@/app/actions/party-packages';
import { getGalleryItems } from '@/app/actions/gallery';
import { HeroEditor } from '@/components/admin/cms/home/HeroEditor';
import { TermsEditor } from '@/components/admin/cms/parties/TermsEditor';
import { PartyAvailabilityEditor } from '@/components/admin/cms/parties/PartyAvailabilityEditor';
import { PartyCarouselEditor } from '@/components/admin/cms/parties/PartyCarouselEditor';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';
import Link from 'next/link';
import { Package, Settings } from 'lucide-react';

export default async function PartiesAdminPage() {
    // Fetch party data in parallel
    const [sections, partyPackages, galleryItems] = await Promise.all([
        getPageSections('party-booking'),
        getPartyPackages(),
        getGalleryItems()
    ]) as [any[], any[], any[]];

    // Filter carousel images
    const carouselImages = galleryItems.filter((item: any) => item.category === 'parties_carousel');

    // Find hero section for party-booking page specifically
    const heroSection = sections.find((s: any) => s.section_key === 'hero');
    const termsSection = sections.find((s: any) => s.section_key === 'terms');

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <CMSBackLink />
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Parties Page Editing</h1>
                <p className="text-slate-500">Manage party booking page content</p>
            </div>

            <div className="grid gap-8">
                {/* Hero Section Editor - Dedicated for Party Booking Page */}
                <section>
                    <HeroEditor section={heroSection} pageSlug="party-booking" />
                </section>

                {/* Party Carousel Editor */}
                <section>
                    <PartyCarouselEditor items={carouselImages} />
                </section>

                {/* Party Availability Editor */}
                <section>
                    <PartyAvailabilityEditor />
                </section>

                {/* Terms Section Editor */}
                <section>
                    <TermsEditor section={termsSection} pageSlug="party-booking" />
                </section>

                {/* Party Packages Link */}
                <section>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Party Packages</h2>
                                <p className="text-sm text-slate-500">Manage party pricing and packages</p>
                            </div>
                            <Link
                                href="/admin/cms/pricing"
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                            >
                                <Package className="w-4 h-4" />
                                Manage Packages
                            </Link>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600">
                                Party packages are managed in the <strong>Pricing</strong> admin page.
                                {partyPackages.length > 0 && (
                                    <span className="ml-2 text-primary font-semibold">
                                        ({partyPackages.length} package{partyPackages.length !== 1 ? 's' : ''} configured)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Booking Form Note */}
                <section>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-2">Booking Form</h3>
                                <p className="text-sm text-blue-700">
                                    The party booking form is functional and processes bookings automatically.
                                    Form fields, pricing calculations, and minimum participant requirements are
                                    managed through the application code.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

