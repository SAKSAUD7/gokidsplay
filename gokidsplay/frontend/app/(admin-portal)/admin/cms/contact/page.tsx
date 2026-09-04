import React from 'react';
import { getSettings } from '@/app/actions/settings';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';
import Link from 'next/link';
import { Settings } from 'lucide-react';

import { ContactHeroEditor } from './components/ContactHeroEditor';
import { ContactFormEditor } from './components/ContactFormEditor';
import { getPageSections } from '@/app/actions/page-sections';

export default async function ContactAdminPage() {
    // Fetch settings and page sections in parallel
    const [settings, sections] = await Promise.all([
        getSettings() as any,
        getPageSections('contact')
    ]);

    // Find the hero section, if it exists
    const heroSection = sections.find((s: any) => s.section_key === 'hero');
    // Find form section
    const formSection = sections.find((s: any) => s.section_key === 'contact_form');

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <CMSBackLink />
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Contact Page Editing</h1>
                <p className="text-slate-500">Manage contact page content</p>
            </div>

            <div className="grid gap-8">
                {/* Hero Editor */}
                <ContactHeroEditor initialData={heroSection} />

                {/* Contact Form Editor */}
                <ContactFormEditor initialData={formSection} />

                {/* Contact Information */}
                <section>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
                                <p className="text-sm text-slate-500">Phone, email, address, and map settings</p>
                            </div>
                            <Link
                                href="/admin/settings"
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                            >
                                <Settings className="w-4 h-4" />
                                Edit Settings
                            </Link>
                        </div>

                        {settings && (
                            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                                <p><strong>Park Name:</strong> {settings.parkName || 'Not set'}</p>
                                <p><strong>Phone:</strong> {settings.contactPhone || 'Not set'}</p>
                                <p><strong>Email:</strong> {settings.contactEmail || 'Not set'}</p>
                                <p><strong>Address:</strong> {settings.address || 'Not set'}</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

