'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, CheckCircle, AlertCircle, ExternalLink, FileText, Shield, Info, Cookie, AlertTriangle, Lock } from 'lucide-react';
import { CollectionList } from '../CollectionList';
import { schemas } from '@/lib/cms/schema';
import { deleteLegalDocument } from '@/app/actions/legal-documents';

interface LegalDocumentsManagerProps {
    items: any[];
}

// All document types the guidelines page expects
const REQUIRED_DOCS = [
    {
        type: 'TERMS',
        label: 'Terms & Conditions',
        description: 'General rules, opening offer, parking, entry fees',
        icon: FileText,
        color: 'blue',
    },
    {
        type: 'PRIVACY',
        label: 'Privacy Policy',
        description: 'Data collection, usage, disclosure, and storage',
        icon: Shield,
        color: 'green',
    },
    {
        type: 'DISCLAIMER',
        label: 'Disclaimer',
        description: 'Liability disclaimer for injuries and property damage',
        icon: AlertTriangle,
        color: 'yellow',
    },
    {
        type: 'COOKIES',
        label: 'Cookies Policy',
        description: 'How cookies are used on the website',
        icon: Cookie,
        color: 'orange',
    },
    {
        type: 'YOUR_RIGHTS',
        label: 'Your Rights',
        description: 'Customer data rights and opt-out information',
        icon: AlertCircle,
        color: 'purple',
    },
    {
        type: 'SECURITY',
        label: 'Security',
        description: 'Data security procedures and SSL encryption',
        icon: Lock,
        color: 'red',
    },
] as const;

const colorMap: Record<string, { badge: string; icon: string; border: string }> = {
    blue:   { badge: 'bg-blue-50 text-blue-700',    icon: 'text-blue-500',   border: 'border-blue-200' },
    green:  { badge: 'bg-green-50 text-green-700',  icon: 'text-green-500',  border: 'border-green-200' },
    yellow: { badge: 'bg-yellow-50 text-yellow-700',icon: 'text-yellow-500', border: 'border-yellow-200' },
    orange: { badge: 'bg-orange-50 text-orange-700',icon: 'text-orange-500', border: 'border-orange-200' },
    purple: { badge: 'bg-purple-50 text-purple-700',icon: 'text-purple-500', border: 'border-purple-200' },
    red:    { badge: 'bg-red-50 text-red-700',      icon: 'text-red-500',    border: 'border-red-200' },
};

export function LegalDocumentsManager({ items }: LegalDocumentsManagerProps) {
    const seededTypes = new Set(items.map((d: any) => d.document_type));
    const seededCount = REQUIRED_DOCS.filter(d => seededTypes.has(d.type)).length;
    const allSeeded = seededCount === REQUIRED_DOCS.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Legal Documents</h2>
                        <p className="text-sm text-slate-500">
                            Manage terms, conditions, waivers, and policies shown on the Guidelines page
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Status pill */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${allSeeded
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                            }`}>
                            {allSeeded
                                ? <CheckCircle className="w-4 h-4" />
                                : <AlertCircle className="w-4 h-4" />
                            }
                            {seededCount}/{REQUIRED_DOCS.length} documents seeded
                        </span>
                        <Link
                            href="/admin/cms/legal-documents/new"
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Document
                        </Link>
                    </div>
                </div>

                {/* Status Grid — all required doc types */}
                <div className="p-6">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        Required Documents for Guidelines Page
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        {REQUIRED_DOCS.map((doc) => {
                            const isSeeded = seededTypes.has(doc.type);
                            const existingDoc = items.find((d: any) => d.document_type === doc.type);
                            const colors = colorMap[doc.color];
                            const Icon = doc.icon;

                            return (
                                <div
                                    key={doc.type}
                                    className={`relative p-4 rounded-xl border-2 transition-all ${isSeeded
                                        ? `${colors.border} bg-white`
                                        : 'border-dashed border-slate-200 bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${isSeeded ? colors.badge : 'bg-slate-100 text-slate-400'}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-800">{doc.label}</span>
                                        </div>
                                        {isSeeded
                                            ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                            : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                                        }
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{doc.description}</p>

                                    {isSeeded ? (
                                        <Link
                                            href={`/admin/cms/legal-documents/${existingDoc?.id}`}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Edit document
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/admin/cms/legal-documents/new`}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add now
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Seed hint banner */}
                    {!allSeeded && (
                        <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">
                                    {REQUIRED_DOCS.length - seededCount} document(s) missing
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    The Guidelines page shows built-in fallback content for missing documents.
                                    Seed the database to make them editable from this CMS. Run{' '}
                                    <code className="font-mono bg-amber-100 px-1 rounded">python manage.py shell &lt; seed_legal_documents.py</code>{' '}
                                    in the backend to auto-populate all documents.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Full list of all existing documents */}
                    {items.length > 0 && (
                        <>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                All Documents in Database
                            </p>
                            <CollectionList
                                schema={schemas.legal_document}
                                items={items}
                                onDelete={deleteLegalDocument}
                                basePath="/admin/cms/legal-documents"
                                titleField="title"
                                subtitleField="document_type"
                                showBackButton={false}
                            />
                        </>
                    )}

                    {items.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No legal documents in the database yet.</p>
                            <p className="text-xs mt-1">Use the seed script or add them manually above.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
