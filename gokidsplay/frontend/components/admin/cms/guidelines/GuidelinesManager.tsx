'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { CollectionList } from '../CollectionList';
import { schemas } from '@/lib/cms/schema';
import { deleteGuidelineCategory } from '@/app/actions/guideline-categories';

interface GuidelinesManagerProps {
    items: any[];
}

export function GuidelinesManager({ items }: GuidelinesManagerProps) {
    const totalItems = items.reduce((acc: number, cat: any) => acc + (cat.items?.length || 0), 0);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Safety Guidelines
                    </h2>
                    <p className="text-sm text-slate-500">
                        Manage safety rule categories shown on the Guidelines page
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {items.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700">
                            <CheckCircle className="w-4 h-4" />
                            {items.length} {items.length === 1 ? 'category' : 'categories'} · {totalItems} rules
                        </span>
                    )}
                    {items.length === 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700">
                            <AlertCircle className="w-4 h-4" />
                            No categories yet
                        </span>
                    )}
                    <Link
                        href="/admin/cms/guideline-categories/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Add Category
                    </Link>
                </div>
            </div>

            <div className="p-6">
                {items.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No safety guideline categories yet.</p>
                        <p className="text-xs mt-1">
                            Add categories like "General Rules", "Skating Etiquette", "Health &amp; Safety".
                        </p>
                        <Link
                            href="/admin/cms/guideline-categories/new"
                            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:underline"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add first category
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Quick preview cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {items.map((cat: any) => (
                                <div key={cat.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{cat.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {cat.items?.length || 0} rule{(cat.items?.length || 0) !== 1 ? 's' : ''}
                                            {cat.icon && <span className="ml-2 text-slate-400">· icon: {cat.icon}</span>}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/admin/cms/guideline-categories/${cat.id}`}
                                        className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 ml-2"
                                    >
                                        <ExternalLink className="w-3 h-3" /> Edit
                                    </Link>
                                </div>
                            ))}
                        </div>

                        <CollectionList
                            schema={schemas.guideline_category}
                            items={items}
                            onDelete={deleteGuidelineCategory}
                            basePath="/admin/cms/guideline-categories"
                            titleField="title"
                            subtitleField="icon"
                            showBackButton={false}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
