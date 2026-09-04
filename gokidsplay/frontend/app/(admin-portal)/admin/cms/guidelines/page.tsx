import React from 'react';
import { getPageSections } from '@/app/actions/page-sections';
import { getGuidelineCategories } from '@/app/actions/guideline-categories';
import { getLegalDocuments } from '@/app/actions/legal-documents';
import { HeroEditor } from '@/components/admin/cms/home/HeroEditor';
import { GuidelinesManager } from '@/components/admin/cms/guidelines/GuidelinesManager';
import { LegalDocumentsManager } from '@/components/admin/cms/guidelines/LegalDocumentsManager';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';
import { Shield, FileText, ExternalLink, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { getFaqs } from '@/app/actions/faqs';

export default async function GuidelinesAdminPage() {
    // Fetch all data in parallel
    const [sections, guidelines, legalDocs, faqs] = await Promise.all([
        getPageSections('guidelines'),
        getGuidelineCategories(),
        getLegalDocuments(),
        getFaqs(),
    ]) as [any[], any[], any[], any[]];

    // Find hero section
    const heroSection = sections.find((s: any) => s.section_key === 'hero');

    const seededDocs = legalDocs.length;
    const totalRequired = 6; // terms, privacy, disclaimer, cookies, your_rights, security
    const allSeeded = seededDocs >= totalRequired;
    const activeFaqs = faqs.filter((f: any) => f.active !== false).length;

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <CMSBackLink />

            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Guidelines Page</h1>
                    <p className="text-slate-500 mt-1">
                        Manage safety guidelines, legal documents, FAQs and the hero section.
                    </p>
                </div>
                <Link
                    href="/guidelines"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                    <ExternalLink className="w-4 h-4" />
                    Preview Page
                </Link>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Safety Guidelines status */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{guidelines.length}</p>
                        <p className="text-sm text-slate-500">Safety Categories</p>
                        {guidelines.length === 0 && (
                            <p className="text-xs text-amber-600 font-medium mt-0.5">⚠ None added yet</p>
                        )}
                    </div>
                </div>

                {/* Legal Documents status */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${allSeeded ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                        <FileText className={`w-6 h-6 ${allSeeded ? 'text-emerald-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{seededDocs}/{totalRequired}</p>
                        <p className="text-sm text-slate-500">Legal Documents</p>
                        {!allSeeded && (
                            <p className="text-xs text-amber-600 font-medium mt-0.5">
                                ⚠ {totalRequired - seededDocs} using fallback
                            </p>
                        )}
                        {allSeeded && (
                            <p className="text-xs text-emerald-600 font-medium mt-0.5">✓ All seeded</p>
                        )}
                    </div>
                </div>

                {/* FAQs status */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="p-3 bg-secondary/10 rounded-xl">
                        <HelpCircle className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{activeFaqs}</p>
                        <p className="text-sm text-slate-500">Active FAQs</p>
                        <Link
                            href="/admin/faqs"
                            className="text-xs text-primary hover:underline mt-0.5 block"
                        >
                            Manage FAQs →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabs / Sections the guidelines page shows */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Tabs visible on the public Guidelines page
                </p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'FAQs',                tab: 'faqs',      status: activeFaqs > 0 },
                        { label: 'Terms & Conditions',  tab: 'terms',     status: legalDocs.some((d: any) => d.document_type === 'TERMS') },
                        { label: 'Privacy Policy',      tab: 'privacy',   status: legalDocs.some((d: any) => d.document_type === 'PRIVACY') },
                        { label: 'Disclaimer',          tab: 'disclaimer',status: legalDocs.some((d: any) => d.document_type === 'DISCLAIMER') },
                        { label: 'Cookies',             tab: 'cookies',   status: legalDocs.some((d: any) => d.document_type === 'COOKIES') },
                        { label: 'Your Rights',         tab: 'rights',    status: legalDocs.some((d: any) => d.document_type === 'YOUR_RIGHTS') },
                        { label: 'Security',            tab: 'security',  status: legalDocs.some((d: any) => d.document_type === 'SECURITY') },
                    ].map(({ label, tab, status }) => (
                        <span
                            key={tab}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${status
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                        >
                            {status
                                ? <CheckCircle className="w-3.5 h-3.5" />
                                : <AlertCircle className="w-3.5 h-3.5" />
                            }
                            {label}
                            {!status && <span className="text-xs opacity-70">(fallback)</span>}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid gap-8">
                {/* Hero Section Editor */}
                <section>
                    <HeroEditor section={heroSection} pageSlug="guidelines" />
                </section>

                {/* Safety Guidelines Manager */}
                <section>
                    <GuidelinesManager items={guidelines} />
                </section>

                {/* Legal Documents Manager */}
                <section>
                    <LegalDocumentsManager items={legalDocs} />
                </section>
            </div>
        </div>
    );
}
